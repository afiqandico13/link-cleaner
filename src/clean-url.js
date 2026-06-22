/* Link Cleaner — URL Cleaning Library
   Pure function: clean URL string by stripping tracking params.
   Returns {cleaned, removed, changed} or null on invalid URL.
*/
(function () {
  "use strict";

  function cleanUrl(url, allowlist, base) {
    if (!url || typeof url !== "string") return null;
    let u;
    try { u = base ? new URL(url, base) : new URL(url); }
    catch (_) { return null; }

    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { cleaned: url, removed: [], changed: false };
    }
    if (Array.isArray(allowlist) && allowlist.includes(u.hostname)) {
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

  window.LinkCleaner = window.LinkCleaner || {};
  window.LinkCleaner.cleanUrl = cleanUrl;
})();
