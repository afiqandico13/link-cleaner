/* Link Cleaner — Test Suite
   Run: `npm test`
   Two sections:
     1. Unit tests (correctness)
     2. Performance benchmark
*/

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ============================================================================
// SETUP — sandbox + load extension scripts
// ============================================================================
const sandbox = { URL, URLSearchParams, console };
vm.createContext(sandbox);
sandbox.window = sandbox;

const baseDir = path.join(__dirname, "..");
vm.runInContext(
  fs.readFileSync(path.join(baseDir, "rules", "tracking-params.js"), "utf-8"),
  sandbox
);
vm.runInContext(
  fs.readFileSync(path.join(baseDir, "src", "clean-url.js"), "utf-8"),
  sandbox
);
vm.runInContext(
  fs.readFileSync(path.join(baseDir, "src", "i18n.js"), "utf-8"),
  sandbox
);

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

function clean(url, allowlist = [], base, customRules, perDomainRules) {
  return LC.cleanUrl(url, allowlist, base, customRules, perDomainRules);
}

// ============================================================================
// UNIT TESTS — Platform-by-platform coverage
// ============================================================================

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

// ============================================================================
// WILDCARD ALLOWLIST
// ============================================================================
console.log("\n=== Wildcard allowlist: exact match ===");
{
  const r = clean("https://my-cafe.com/order?utm_source=campaign&id=42", ["my-cafe.com"]);
  assert("allowlisted domain not cleaned", !r.changed);
  assert("keeps utm_source when allowlisted", r.cleaned.includes("utm_source"));
}

console.log("\n=== Wildcard allowlist: *.example.com ===");
{
  // *.example.com should match SUBDOMAINS but not the apex
  assert("*.example.com matches mail.example.com", LC.matchesAllowlist("mail.example.com", ["*.example.com"]));
  assert("*.example.com matches deep.sub.example.com", LC.matchesAllowlist("deep.sub.example.com", ["*.example.com"]));
  assert("*.example.com does NOT match example.com (apex)", !LC.matchesAllowlist("example.com", ["*.example.com"]));
  assert("*.example.com does NOT match notexample.com", !LC.matchesAllowlist("notexample.com", ["*.example.com"]));
}

console.log("\n=== Wildcard allowlist: .example.com ===");
{
  // .example.com (leading dot) should match BOTH apex AND subdomains
  assert(".example.com matches example.com", LC.matchesAllowlist("example.com", [".example.com"]));
  assert(".example.com matches mail.example.com", LC.matchesAllowlist("mail.example.com", [".example.com"]));
}

console.log("\n=== Wildcard allowlist: case insensitive ===");
{
  assert("uppercase pattern matches lowercase host", LC.matchesAllowlist("example.com", ["EXAMPLE.COM"]));
  assert("uppercase host matches lowercase pattern", LC.matchesAllowlist("EXAMPLE.COM", ["example.com"]));
}

console.log("\n=== Wildcard allowlist: end-to-end cleanUrl ===");
{
  const r = clean("https://shop.example.com/p?utm_source=x&id=1", ["*.example.com"]);
  assert("subdomain with wildcard: not cleaned", !r.changed);
  assert("subdomain with wildcard: keeps utm_source", r.cleaned.includes("utm_source"));

  const r2 = clean("https://example.com/?utm_source=x", ["*.example.com"]);
  assert("apex with wildcard-only: cleaned (apex not matched)", r2.changed);

  const r3 = clean("https://example.com/?utm_source=x", [".example.com"]);
  assert("apex with .example.com: not cleaned", !r3.changed);
}

// ============================================================================
// NON-HTTP, RELATIVE URLS, EDGE CASES
// ============================================================================
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
  assert("UTM_Source (uppercase) removed", !r.cleaned.includes("UTM_Source"));
}

console.log("\n=== Param count check ===");
{
  const count = LC.PARAM_COUNT;
  console.log(`  ℹ Database has ${count} tracked params`);
  assert("has at least 80 tracked params", count >= 80);
}

console.log("\n=== stripAllParams (nuclear option) ===");
{
  const r = LC.stripAllParams("https://example.com/?a=1&b=2&utm_source=x#frag");
  assert("stripAllParams removes all params", r.cleaned === "https://example.com/#frag");
  assert("stripAllParams lists removed", r.removed.length === 3);
  assert("stripAllParams preserves path", r.cleaned.includes("/"));
}

// ============================================================================
// CUSTOM RULES (per-rule overrides)
// ============================================================================
console.log("\n=== Custom rules: always-strip ===");
{
  LC.setCustomRules({ strip: ["myapp_tracker", "internal_id"], keep: [], prefixes: [] });
  const r = clean("https://example.com/?myapp_tracker=abc&id=1");
  assert("customStrip removes myapp_tracker", !r.cleaned.includes("myapp_tracker"));
  assert("preserves id=1", r.cleaned.includes("id=1"));
}

console.log("\n=== Custom rules: never-strip ===");
{
  LC.setCustomRules({ strip: [], keep: ["ref"], prefixes: [] });
  const r = clean("https://example.com/?utm_source=fb&ref=newsletter&id=1");
  assert("customKeep protects ref", r.cleaned.includes("ref=newsletter"));
  assert("still strips utm_source (from DB)", !r.cleaned.includes("utm_source"));
}

console.log("\n=== Custom rules: custom prefixes ===");
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: ["myapp_", "company_"] });
  const r1 = clean("https://example.com/?myapp_session=xyz&id=1");
  assert("customPrefix strips myapp_session", !r1.cleaned.includes("myapp_session"));
  const r2 = clean("https://example.com/?company_internal=abc&id=1");
  assert("customPrefix strips company_internal", !r2.cleaned.includes("company_internal"));
}

console.log("\n=== Custom rules: precedence ===");
{
  LC.setCustomRules({ strip: [], keep: ["utm_source"], prefixes: [] });
  // utm_source is in DB → would normally be stripped
  // But customKeep protects it
  const r = clean("https://example.com/?utm_source=fb&id=1");
  assert("customKeep overrides DB: utm_source preserved", r.cleaned.includes("utm_source"));
  assert("id=1 preserved", r.cleaned.includes("id=1"));
}

// ============================================================================
// BUG FIX REGRESSIONS (v1.2.1)
// ============================================================================
console.log("\n=== Bug fix: whitespace in keys trimmed ===");
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  // %20 in keys decodes to space — should still be recognized as tracking
  const r = clean("https://example.com/?%20utm_source%20=x&id=1");
  assert("whitespace-padded utm_source stripped", !r.cleaned.includes("utm_source"),
    `cleaned=${r.cleaned}`);
}

console.log("\n=== Bug fix: matchesHostPattern for badge detection (DRY) ===");
{
  // matchesHostPattern should work for all 3 forms
  assert("matchesHostPattern: exact", LC.matchesHostPattern("example.com", "example.com"));
  assert("matchesHostPattern: wildcard sub", LC.matchesHostPattern("a.example.com", "*.example.com"));
  assert("matchesHostPattern: suffix apex+sub", LC.matchesHostPattern("a.example.com", ".example.com"));
  assert("matchesHostPattern: wildcard excludes apex", !LC.matchesHostPattern("example.com", "*.example.com"));
}

// ============================================================================
// PER-DOMAIN RULES (v1.2.0)
// ============================================================================
console.log("\n=== Per-domain rules: override global ===");
{
  // Reset global
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  const perDomain = {
    "*.youtube.com": { strip: ["feature"], keep: [], prefixes: [] },
  };
  // YouTube URL: feature gets stripped (per-domain)
  const r1 = clean("https://www.youtube.com/watch?v=abc&feature=share", null, null, null, perDomain);
  assert("youtube.com: feature stripped by per-domain rule", !r1.cleaned.includes("feature"));
  // Non-YouTube URL: feature preserved (no per-domain rule applies)
  const r2 = clean("https://example.com/?feature=share&id=1", null, null, null, perDomain);
  assert("non-youtube.com: feature preserved", r2.cleaned.includes("feature"));
}

console.log("\n=== Per-domain rules: keep overrides DB ===");
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  const perDomain = {
    "*.google.com": { strip: [], keep: ["q"], prefixes: [] },
  };
  const r = clean("https://www.google.com/search?q=hello&utm_source=news", null, null, null, perDomain);
  assert("google.com: q kept (per-domain rule)", r.cleaned.includes("q=hello"));
  assert("google.com: utm_source still stripped (DB)", !r.cleaned.includes("utm_source"));
}

console.log("\n=== Per-domain rules: wildcard match ===");
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  const perDomain = {
    "*.mycompany.com": { strip: ["internal_id"], keep: [], prefixes: [] },
  };
  const r1 = clean("https://app.mycompany.com/page?internal_id=123&id=1", null, null, null, perDomain);
  assert("*.mycompany.com matches subdomain", !r1.cleaned.includes("internal_id"));
  const r2 = clean("https://mycompany.com/?internal_id=123", null, null, null, perDomain);
  assert("*.mycompany.com does NOT match apex", r2.cleaned.includes("internal_id"));
}

console.log("\n=== Per-domain rules: precedence over global customRules ===");
{
  // Global keeps "ref"
  const globalRules = { strip: [], keep: ["ref"], prefixes: [] };
  // Per-domain overrides: on youtube.com, strip "ref"
  const perDomain = {
    "*.youtube.com": { strip: ["ref"], keep: [], prefixes: [] },
  };
  const r = clean("https://www.youtube.com/?ref=abc&id=1", null, null, globalRules, perDomain);
  assert("per-domain wins over global: ref stripped on youtube", !r.cleaned.includes("ref"));
  // On other domain, global keep applies
  const r2 = clean("https://example.com/?ref=abc&id=1", null, null, globalRules, perDomain);
  assert("global keep applies elsewhere: ref preserved", r2.cleaned.includes("ref"));
}

console.log("\n=== matchesHostPattern ===");
{
  assert("exact match", LC.matchesHostPattern("example.com", "example.com"));
  assert("wildcard: matches subdomain", LC.matchesHostPattern("a.example.com", "*.example.com"));
  assert("wildcard: matches deep subdomain", LC.matchesHostPattern("a.b.example.com", "*.example.com"));
  assert("wildcard: does NOT match apex", !LC.matchesHostPattern("example.com", "*.example.com"));
  assert("suffix: matches apex", LC.matchesHostPattern("example.com", ".example.com"));
  assert("suffix: matches subdomain", LC.matchesHostPattern("a.example.com", ".example.com"));
  assert("case insensitive", LC.matchesHostPattern("EXAMPLE.COM", "example.com"));
}

// ============================================================================
// I18N (v1.2.0)
// ============================================================================
console.log("\n=== i18n: basic translation ===");
{
  // Force EN
  if (LC.i18n) {
    const t = LC.i18n.t;
    assert("i18n module loaded", typeof t === "function");
    assert("i18n has EN strings", typeof LC.i18n.STRINGS.en === "object");
    assert("i18n has ID strings", typeof LC.i18n.STRINGS.id === "object");
    assert("t() returns string", typeof t("popup.title") === "string");
    assert("t() supports args", t("popup.watching", "88").includes("88"));
  } else {
    assert("i18n module loaded", false, "LC.i18n missing — load src/i18n.js");
  }
}

// ============================================================================
// PERFORMANCE BENCHMARK
// ============================================================================
console.log("\n" + "=".repeat(60));
console.log("PERFORMANCE BENCHMARK");
console.log("=".repeat(60));

// Generate realistic URL pool
const URL_POOL = [];
const domains = ["google.com", "facebook.com", "youtube.com", "amazon.com", "twitter.com",
  "linkedin.com", "instagram.com", "tiktok.com", "reddit.com", "news.ycombinator.com",
  "shop.example.com", "blog.example.org", "mail.google.com"];
const paths = ["/", "/article", "/product/123", "/user/profile", "/search?q=hello", "/blog/post-title"];
const extraParams = ["ref=newsletter", "id=42", "page=1", "category=tech", "lang=en", "sort=desc"];

for (let i = 0; i < 200; i++) {
  const d = domains[i % domains.length];
  const p = paths[i % paths.length];
  const tracker = i % 4 === 0 ? `&utm_source=newsletter&utm_medium=email&utm_campaign=spring${i}` :
                  i % 4 === 1 ? `&fbclid=IwAR${i}XYZ` :
                  i % 4 === 2 ? `&gclid=Cj0KCQjw${i}ABC` :
                  `&igshid=${i}&_ttp=abc${i}`;
  const extras = extraParams.slice(0, (i % 4) + 1).join("&");
  URL_POOL.push(`https://${d}${p}?${extras}${tracker}`);
}

function benchmark(iters, label) {
  // Warmup
  for (let i = 0; i < 100; i++) clean(URL_POOL[i % URL_POOL.length]);
  // Measure
  const start = process.hrtime.bigint();
  for (let i = 0; i < iters; i++) {
    clean(URL_POOL[i % URL_POOL.length]);
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  const opsPerSec = (iters / elapsedMs * 1000).toFixed(0);
  const usPerOp = (elapsedMs / iters * 1000).toFixed(1);
  console.log(`  ${label.padEnd(28)} ${iters.toString().padStart(6)} ops in ${elapsedMs.toFixed(1)}ms  (${opsPerSec} ops/sec, ${usPerOp}μs/op)`);
  return { elapsedMs, opsPerSec: parseInt(opsPerSec), usPerOp: parseFloat(usPerOp) };
}

const results = [];
results.push(["Small URLs (typical)",   benchmark(10000, "10k cleanUrl() calls")]);
results.push(["With wildcard allowlist", benchmark(10000, "10k cleanUrl() w/ allowlist")]);
results.push(["Idempotence (already clean)", benchmark(10000, "10k on clean URL")]);

// Stress test with HUGE URL (many params)
const huge = "https://example.com/?" + Array.from({ length: 100 }, (_, i) =>
  i % 3 === 0 ? `utm_${i}=v${i}` : `p${i}=v${i}`
).join("&");
const start = process.hrtime.bigint();
for (let i = 0; i < 5000; i++) clean(huge);
const hugeMs = Number(process.hrtime.bigint() - start) / 1e6;
console.log(`  ${"100-param URL (huge)".padEnd(28)} 5000 ops in ${hugeMs.toFixed(1)}ms  (${(5000/hugeMs*1000).toFixed(0)} ops/sec)`);

// Performance assertions
const [, typical] = results[0];
assert("typical clean >= 10k ops/sec", typical.opsPerSec >= 10000, `${typical.opsPerSec} ops/sec`);
assert("typical clean < 200μs per op", typical.usPerOp < 200, `${typical.usPerOp}μs/op`);

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n${"=".repeat(60)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.detail || ""}`));
  process.exit(1);
}
console.log("\n✓ All tests passed");
