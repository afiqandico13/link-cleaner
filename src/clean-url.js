/* Link Cleaner — URL Cleaning Library
   Pure function: clean URL string by stripping tracking params.
   Supports wildcard allowlist (*.example.com, .example.com).

   Returns {cleaned, removed, changed} | null on invalid URL.
*/
(function () {
  "use strict";

  /**
   * Match hostname against allowlist patterns.
   * Supports three pattern forms:
   *   "example.com"        — exact match only
   *   "*.example.com"      — any SUBDOMAIN of example.com (not the apex)
   *   ".example.com"       — example.com AND any subdomain
   *
   * @param {string} hostname - URL hostname (lowercase expected)
   * @param {string[]} allowlist - patterns (case insensitive)
   * @returns {boolean}
   */
  function matchesAllowlist(hostname, allowlist) {
    if (!hostname || !Array.isArray(allowlist) || allowlist.length === 0) return false;
    const host = String(hostname).toLowerCase();
    for (const raw of allowlist) {
      if (!raw) continue;
      const p = String(raw).toLowerCase().trim();
      if (!p) continue;

      if (p.startsWith("*.")) {
        // Wildcard subdomain: *.example.com matches a.example.com, a.b.example.com
        // Does NOT match example.com itself (the apex).
        const base = p.slice(2);
        if (!base) continue;
        if (host === base) continue;
        if (host.endsWith("." + base)) return true;
      } else if (p.startsWith(".")) {
        // Leading-dot suffix: .example.com matches example.com AND subdomains
        const base = p.slice(1);
        if (!base) continue;
        if (host === base || host.endsWith("." + base)) return true;
      } else {
        // Exact match
        if (host === p) return true;
      }
    }
    return false;
  }

  /**
   * Clean a URL string by stripping tracking parameters.
   *
   * @param {string} url - URL to clean (absolute or relative)
   * @param {string[]} [allowlist=[]] - allowlist hostnames (supports wildcards)
   * @param {string} [base] - base URL for resolving relative URLs
   * @returns {{cleaned: string, removed: string[], changed: boolean} | null}
   */
  function cleanUrl(url, allowlist, base) {
    if (!url || typeof url !== "string") return null;
    let u;
    try {
      u = base ? new URL(url, base) : new URL(url);
    } catch (_) {
      return null;
    }

    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { cleaned: url, removed: [], changed: false };
    }

    if (matchesAllowlist(u.hostname, allowlist)) {
      return { cleaned: u.toString(), removed: [], changed: false };
    }

    const removed = [];
    for (const key of Array.from(u.searchParams.keys())) {
      if (window.LinkCleaner.shouldStrip(key)) removed.push(key);
    }
    if (removed.length === 0) return { cleaned: u.toString(), removed: [], changed: false };

    for (const k of removed) u.searchParams.delete(k);
    return { cleaned: u.toString(), removed, changed: true };
  }

  /**
   * Strip ALL query parameters from a URL. Useful for the "strip everything" option.
   * @param {string} url
   * @returns {string|null} cleaned URL or null if invalid
   */
  function stripAllParams(url, base) {
    if (!url || typeof url !== "string") return null;
    let u;
    try { u = base ? new URL(url, base) : new URL(url); }
    catch (_) { return null; }
    if (u.protocol !== "http:" && u.protocol !== "https:") return url;
    const original = u.toString();
    u.search = "";
    return { cleaned: u.toString(), removed: Array.from(new URL(original).searchParams.keys()), changed: original !== u.toString() };
  }

  window.LinkCleaner = window.LinkCleaner || {};
  window.LinkCleaner.cleanUrl = cleanUrl;
  window.LinkCleaner.stripAllParams = stripAllParams;
  window.LinkCleaner.matchesAllowlist = matchesAllowlist;
})();
