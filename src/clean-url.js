/* Link Cleaner — URL Cleaning Library
   Pure function: clean URL string by stripping tracking params.
   Supports wildcard allowlist (*.example.com, .example.com).

   Returns {cleaned, removed, changed} | null on invalid URL.
*/
(function () {
  "use strict";

  /**
   * Match hostname against a single pattern (used by allowlist + per-domain).
   * Supports the same forms as matchesAllowlist.
   */
  function matchesHostPattern(hostname, pattern) {
    if (!hostname || !pattern) return false;
    const host = String(hostname).toLowerCase();
    const p = String(pattern).toLowerCase().trim();
    if (!p) return false;
    if (p.startsWith("*.")) {
      const base = p.slice(2);
      if (!base) return false;
      if (host === base) return false;
      return host.endsWith("." + base);
    }
    if (p.startsWith(".")) {
      const base = p.slice(1);
      if (!base) return false;
      return host === base || host.endsWith("." + base);
    }
    return host === p;
  }

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
    for (const raw of allowlist) {
      if (matchesHostPattern(hostname, raw)) return true;
    }
    return false;
  }

  /**
   * Pick the most-specific per-domain rule that matches the hostname.
   * Per-domain rules override global rules for matching hosts.
   * Returns {strip, keep, prefixes} or null if no per-domain rule matches.
   */
  function findPerDomainRules(hostname, perDomainRules) {
    if (!hostname || !perDomainRules || typeof perDomainRules !== "object") return null;
    for (const [pattern, rules] of Object.entries(perDomainRules)) {
      if (matchesHostPattern(hostname, pattern)) {
        return rules || {};
      }
    }
    return null;
  }

  /**
   * Clean a URL string by stripping tracking parameters.
   *
   * @param {string} url - URL to clean (absolute or relative)
   * @param {string[]} [allowlist=[]] - allowlist hostnames (supports wildcards)
   * @param {string} [base] - base URL for resolving relative URLs
   * @param {{strip?: string[], keep?: string[], prefixes?: string[]}} [customRules]
   *   - global custom rules (applied unless per-domain rules override)
   * @param {Object} [perDomainRules] - per-domain overrides keyed by host pattern
   * @returns {{cleaned: string, removed: string[], changed: boolean} | null}
   */
  function cleanUrl(url, allowlist, base, customRules, perDomainRules) {
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

    // Pick effective rules: per-domain wins, else global custom rules
    const effective = findPerDomainRules(u.hostname, perDomainRules)
                   || customRules;

    // Apply rules only if caller passed explicit rules. Save current state
    // and restore after, so we don't leak per-host rules into the global DB.
    let savedStrip, savedKeep, savedPrefixes;
    if (effective) {
      const lc = window.LinkCleaner;
      savedStrip = new Set(lc.customStrip);
      savedKeep = new Set(lc.customKeep);
      savedPrefixes = new Set(lc.customPrefixes);
      lc.setCustomRules({
        strip: effective.strip || [],
        keep: effective.keep || [],
        prefixes: effective.prefixes || [],
      });
    }

    const removed = [];
    for (const key of Array.from(u.searchParams.keys())) {
      if (window.LinkCleaner.shouldStrip(key)) removed.push(key);
    }

    // Restore global state
    if (effective) {
      window.LinkCleaner.setCustomRules({
        strip: Array.from(savedStrip),
        keep: Array.from(savedKeep),
        prefixes: Array.from(savedPrefixes),
      });
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
  window.LinkCleaner.matchesHostPattern = matchesHostPattern;
  window.LinkCleaner.findPerDomainRules = findPerDomainRules;
})();
