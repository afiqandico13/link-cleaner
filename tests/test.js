/* Link Cleaner — Test Suite
   Run: `node tests/test.js`
   No dependencies; uses jsdom-like minimal URL polyfill via global URL.

   Verifies that:
   - Tracking params from each major platform are correctly stripped
   - Non-tracking params are preserved
   - Allowlist is honored
   - Non-http(s) URLs are passed through
   - Idempotence: cleaning twice gives same result
*/

"use strict";
const fs = require("fs");
const path = require("path");

// Minimal sandbox: load tracking-params.js and clean-url.js into a shared scope
const sandbox = { URL, URLSearchParams, console };
const vm = require("vm");
vm.createContext(sandbox);
sandbox.window = sandbox;

const baseDir = path.join(__dirname, "..");
const trackingParams = fs.readFileSync(path.join(baseDir, "rules", "tracking-params.js"), "utf-8");
const cleanUrlLib = fs.readFileSync(path.join(baseDir, "src", "clean-url.js"), "utf-8");

vm.runInContext(trackingParams, sandbox);
vm.runInContext(cleanUrlLib, sandbox);

const LC = sandbox.LinkCleaner;
if (!LC || !LC.cleanUrl) {
  console.error("FAIL: LinkCleaner globals not loaded");
  process.exit(1);
}

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push({ name, detail });
    console.log(`  ✗ ${name}`);
    if (detail) console.log(`      ${detail}`);
  }
}

function clean(url, allowlist = [], base) {
  return LC.cleanUrl(url, allowlist, base);
}

// ---------------------------------------------------------------------------
// TESTS
// ---------------------------------------------------------------------------

console.log("\n=== Google Analytics ===");
{
  const r = clean("https://example.com/article?utm_source=newsletter&id=42");
  assert("removes utm_source", r.changed && !r.cleaned.includes("utm_source"));
  assert("preserves id=42", r.cleaned.includes("id=42"));
}

console.log("\n=== Facebook ===");
{
  const r = clean("https://example.com/?fbclid=abc123&product=shoes");
  assert("removes fbclid", r.changed && !r.cleaned.includes("fbclid"));
  assert("preserves product", r.cleaned.includes("product=shoes"));
}

console.log("\n=== Instagram ===");
{
  const r = clean("https://instagram.com/p/ABC/?igshid=xyz");
  assert("removes igshid", r.changed && !r.cleaned.includes("igshid"));
}

console.log("\n=== TikTok ===");
{
  const r = clean("https://tiktok.com/@user?_ttp=12345");
  assert("removes _ttp", r.changed && !r.cleaned.includes("_ttp"));
}

console.log("\n=== LinkedIn ===");
{
  const r = clean("https://linkedin.com/posts/abc?trk=feed&lipi=urn");
  assert("removes trk", r.changed && !r.cleaned.includes("trk="));
  assert("removes lipi", r.changed && !r.cleaned.includes("lipi"));
}

console.log("\n=== Mailchimp ===");
{
  const r = clean("https://example.com/?mc_cid=abc&mc_eid=def&id=42");
  assert("removes mc_cid", !r.cleaned.includes("mc_cid"));
  assert("removes mc_eid", !r.cleaned.includes("mc_eid"));
  assert("preserves id=42", r.cleaned.includes("id=42"));
}

console.log("\n=== HubSpot ===");
{
  const r = clean("https://hubspot.com/?_hsenc=abc&__hssc=def&page=1");
  assert("removes _hsenc", !r.cleaned.includes("_hsenc"));
  assert("removes __hssc", !r.cleaned.includes("__hssc"));
  assert("preserves page=1", r.cleaned.includes("page=1"));
}

console.log("\n=== Prefix matching (utm_*) ===");
{
  const r = clean("https://x.com/?utm_custom_param=foo&page=1");
  assert("removes utm_custom_param (prefix)", !r.cleaned.includes("utm_custom_param"));
  assert("preserves page", r.cleaned.includes("page=1"));
}

console.log("\n=== Multiple trackers at once ===");
{
  const r = clean(
    "https://shop.com/product/1?utm_source=ig&utm_medium=cpc&fbclid=ABC&gclid=XYZ&q=shoes"
  );
  assert("removes all 4 trackers", !r.cleaned.match(/utm_|fbclid|gclid/));
  assert("preserves q=shoes", r.cleaned.includes("q=shoes"));
  assert("removes 4 params", r.removed.length === 4);
}

console.log("\n=== Idempotence ===");
{
  const r1 = clean("https://example.com/?utm_source=x&id=42");
  const r2 = clean(r1.cleaned);
  assert("cleaning twice gives same URL", r1.cleaned === r2.cleaned);
  assert("second pass has no changes", !r2.changed);
}

console.log("\n=== Allowlist ===");
{
  const r = clean(
    "https://my-cafe.com/order?utm_source=campaign&id=42",
    ["my-cafe.com"]
  );
  assert("allowlisted domain not cleaned", !r.changed);
  assert("keeps utm_source when allowlisted", r.cleaned.includes("utm_source"));
}

console.log("\n=== Non-http URLs ===");
{
  assert(
    "mailto: passed through unchanged",
    clean("mailto:hello@example.com").cleaned === "mailto:hello@example.com"
  );
  assert(
    "tel: passed through unchanged",
    clean("tel:+1234567890").cleaned === "tel:+1234567890"
  );
  assert(
    "javascript: passed through unchanged",
    clean("javascript:void(0)").cleaned === "javascript:void(0)"
  );
}

console.log("\n=== Relative URLs ===");
{
  const r = clean("/article?utm_source=fb&page=2", [], "https://example.com/");
  assert("relative URL cleaned with base", r.changed);
  assert("has correct base", r.cleaned.startsWith("https://example.com/article"));
  assert("removes utm_source", !r.cleaned.includes("utm_source"));
}

console.log("\n=== Edge cases ===");
{
  assert("invalid URL returns null", clean("not-a-url-at-all") === null);
  assert("empty string returns null", clean("") === null);
  assert("null returns null", clean(null) === null);
  assert("undefined returns null", clean(undefined) === null);
  const r = clean("https://example.com/");
  assert("URL without params: unchanged", !r.changed && r.cleaned === "https://example.com/");
  const r2 = clean("https://example.com/path?#fragment");
  assert("fragment-only URL: still processed", r2 !== null);
}

console.log("\n=== Case insensitivity ===");
{
  const r = clean("https://example.com/?UTM_Source=news&FbClid=ABC&id=1");
  assert("UTM_Source (uppercase) removed", !r.cleaned.toLowerCase().includes("utm_source") || !r.cleaned.includes("UTM_Source"));
  // cleaned URL uses URL normalization, lowercase keys
  assert("result has lowercase keys", r.cleaned.includes("utm_source") === false);
}

console.log("\n=== Param count check ===");
{
  const count = LC.PARAM_COUNT;
  console.log(`  ℹ Database has ${count} tracked params`);
  assert("has at least 60 tracked params", count >= 60);
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(60)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.detail || ""}`));
  process.exit(1);
}
console.log("\n✓ All tests passed");
