/* Edge case tests to hunt bugs in Link Cleaner */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { URL, URLSearchParams, console };
vm.createContext(sandbox);
sandbox.window = sandbox;
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "rules", "tracking-params.js"), "utf-8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", "clean-url.js"), "utf-8"), sandbox);

const LC = sandbox.LinkCleaner;
LC.setCustomRules({ strip: [], keep: [], prefixes: [] });

let passed = 0, failed = 0;
const failures = [];
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? "  — " + detail : ""}`); }
}

console.log("\n=== Bug hunt: edge case URLs ===");

// Empty param value
{
  const r = LC.cleanUrl("https://example.com/?utm_source=&id=42");
  assert("empty value param removed", !r.cleaned.includes("utm_source"));
  assert("id preserved", r.cleaned.includes("id=42"));
}

// Bare key (no = sign)
{
  const r = LC.cleanUrl("https://example.com/?utm_source&id=42");
  // bare keys may not be detected by shouldStrip — depends on impl
  console.log(`    debug: ${r.cleaned}`);
}

// Just question mark
{
  const r = LC.cleanUrl("https://example.com/?");
  assert("just ? URL", r.cleaned === "https://example.com/?", `got ${r.cleaned}`);
}

// URL with port
{
  const r = LC.cleanUrl("https://example.com:8080/page?utm_source=x&id=1");
  assert("port preserved", r.cleaned.includes(":8080"));
  assert("tracker removed", !r.cleaned.includes("utm_source"));
}

// URL with credentials
{
  const r = LC.cleanUrl("https://user:pass@example.com/?utm_source=x&id=1");
  assert("URL with credentials: utm removed", !r.cleaned.includes("utm_source"));
  // Credentials are sensitive — should they be preserved?
  console.log(`    result: ${r.cleaned}`);
}

// IPv6
{
  try {
    const r = LC.cleanUrl("https://[::1]:8080/path?utm_source=x&id=1");
    assert("IPv6 URL: utm removed", !r.cleaned.includes("utm_source"));
  } catch (e) {
    console.log(`    IPv6: ${e.message}`);
  }
}

// IDN domain
{
  try {
    const r = LC.cleanUrl("https://münchen.de/?utm_source=x&id=1");
    console.log(`    IDN result: ${r.cleaned}`);
  } catch (e) {
    console.log(`    IDN: ${e.message}`);
  }
}

// URL with hash + params
{
  const r = LC.cleanUrl("https://example.com/?utm_source=x&id=1#section");
  assert("hash preserved", r.cleaned.includes("#section"));
  assert("utm removed", !r.cleaned.includes("utm_source"));
}

// URL with multiple `?` (malformed)
{
  try {
    const r = LC.cleanUrl("https://example.com/?utm_source=x?foo=bar&id=1");
    console.log(`    multi-?: ${r.cleaned}`);
  } catch (e) {
    console.log(`    multi-?: error ${e.message}`);
  }
}

// URL with quotes in value
{
  const r = LC.cleanUrl('https://example.com/?utm_source="quoted"&id=42');
  assert("quote in value: utm removed", !r.cleaned.includes("utm_source"));
  assert("id preserved", r.cleaned.includes("id=42"));
}

// URL with backslash
{
  try {
    const r = LC.cleanUrl("https://example.com/path\\backslash?utm_source=x&id=1");
    console.log(`    backslash: ${r.cleaned}`);
  } catch (e) {
    console.log(`    backslash: error ${e.message}`);
  }
}

// Very long URL (1000 params)
{
  const params = [];
  for (let i = 0; i < 1000; i++) {
    params.push(i % 3 === 0 ? `utm_${i}=v${i}` : `p${i}=v${i}`);
  }
  const longUrl = "https://example.com/?" + params.join("&");
  const start = Date.now();
  const r = LC.cleanUrl(longUrl);
  const elapsed = Date.now() - start;
  assert("long URL processed", r !== null);
  console.log(`    long URL (${longUrl.length} chars) took ${elapsed}ms`);
  assert("long URL: utm_ removed", !r.cleaned.includes("utm_"));
}

// URL with null bytes
{
  try {
    const r = LC.cleanUrl("https://example.com/?utm_source=x%00&id=1");
    console.log(`    null byte: ${r.cleaned}`);
  } catch (e) {
    console.log(`    null byte: error ${e.message}`);
  }
}

// URL with unicode in value
{
  const r = LC.cleanUrl("https://example.com/?utm_source=café&id=42");
  assert("unicode in value: utm removed", !r.cleaned.includes("utm_source"));
  assert("id preserved", r.cleaned.includes("id=42"));
}

// URL with array syntax
{
  const r = LC.cleanUrl("https://example.com/?tags[]=a&tags[]=b&utm_source=x&id=1");
  assert("array param: utm removed", !r.cleaned.includes("utm_source"));
  assert("tags preserved", r.cleaned.includes("tags"));
}

// Multiple utm_source (only first removed since key can appear once)
{
  const r = LC.cleanUrl("https://example.com/?utm_source=a&utm_source=b&id=1");
  assert("duplicate params: both utm removed", !r.cleaned.includes("utm_source"));
  assert("id preserved", r.cleaned.includes("id=1"));
}

// URL with only tracking params
{
  const r = LC.cleanUrl("https://example.com/?utm_source=x&utm_medium=y&utm_campaign=z");
  assert("only trackers: all removed", !r.cleaned.includes("utm_source") && !r.cleaned.includes("utm_medium"));
  // Result should have empty query
  console.log(`    result: ${r.cleaned}`);
}

// URL with special chars in key
{
  try {
    const r = LC.cleanUrl("https://example.com/?foo[bar]=baz&utm_source=x&id=1");
    assert("special chars in key: utm removed", !r.cleaned.includes("utm_source"));
    assert("id preserved", r.cleaned.includes("id=1"));
  } catch (e) {
    console.log(`    special: error ${e.message}`);
  }
}

// Base URL for relative
{
  const r = LC.cleanUrl("article?utm_source=x&id=1", null, "https://example.com/");
  assert("relative URL cleaned with base", !r.cleaned.includes("utm_source"));
  assert("absolute URL resolved", r.cleaned.startsWith("https://example.com/"));
}

// Same key, different cases
{
  const r = LC.cleanUrl("https://example.com/?UTM_SOURCE=x&utm_source=y&id=1");
  console.log(`    case: ${r.cleaned}`);
  // Both should be removed (case insensitive)
}

// Trim whitespace in key
{
  const r = LC.cleanUrl("https://example.com/?%20utm_source%20=x&id=1");
  console.log(`    whitespace: ${r.cleaned}`);
}

console.log("\n=== Bug hunt: per-domain rules edge cases ===");

// Empty rule
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  const perDomain = { "*.example.com": {} };
  const r = LC.cleanUrl("https://example.com/?utm_source=x&id=1", null, null, null, perDomain);
  console.log(`    empty rule: ${r.cleaned}`);
  // Should behave like no rule (DB applies)
}

// Per-domain rule with empty arrays
{
  const perDomain = { "*.example.com": { strip: [], keep: [], prefixes: [] } };
  const r = LC.cleanUrl("https://example.com/?utm_source=x&id=1", null, null, null, perDomain);
  console.log(`    empty arrays rule: ${r.cleaned}`);
}

// Per-domain rule with null values
{
  const perDomain = { "*.example.com": { strip: null, keep: null, prefixes: null } };
  try {
    const r = LC.cleanUrl("https://example.com/?utm_source=x&id=1", null, null, null, perDomain);
    console.log(`    null values: ${r.cleaned}`);
  } catch (e) {
    console.log(`    null values: ERROR ${e.message}`);
  }
}

// Multiple per-domain patterns — which wins?
{
  LC.setCustomRules({ strip: [], keep: [], prefixes: [] });
  const perDomain = {
    "*.example.com": { strip: ["a"], keep: [], prefixes: [] },
    ".example.com": { strip: ["b"], keep: [], prefixes: [] },
  };
  const r = LC.cleanUrl("https://www.example.com/?a=1&b=2&id=3", null, null, null, perDomain);
  console.log(`    multiple per-domain: ${r.cleaned}`);
  // Per-iteration order matters — which one is used?
}

console.log("\n=== Bug hunt: allowlist + custom rules interaction ===");

// Custom rules + allowlist
{
  LC.setCustomRules({ strip: ["x"], keep: [], prefixes: [] });
  const r = LC.cleanUrl("https://allowlisted.com/?x=1&id=2", ["allowlisted.com"]);
  // Allowlist takes precedence — no stripping
  console.log(`    allowlist wins: ${r.cleaned}`);
}

// Custom rules but allowlist applies
{
  const r = LC.cleanUrl("https://example.com/?x=1&id=2", ["example.com"], null, { strip: ["x"], keep: [], prefixes: [] });
  console.log(`    allowlist + custom: ${r.cleaned}`);
}

console.log(`\n${"=".repeat(60)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));
if (failed > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.detail || ""}`));
  process.exit(1);
}