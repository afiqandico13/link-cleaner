/* Link Cleaner — Content Script
   Loaded into every page. Intercepts link clicks, rewrites anchor href attributes
   so right-click "copy link" gets the clean URL too, and watches for SPA/DOM changes.

   Settings:
     - enabled:    global on/off (loaded from storage)
     - allowlist:  array of hostnames to skip
*/
(function () {
  "use strict";
  if (window.__linkCleanerContentLoaded) return;
  window.__linkCleanerContentLoaded = true;

  const LC = window.LinkCleaner;
  if (!LC || !LC.cleanUrl || !LC.shouldStrip) {
    console.warn("[LinkCleaner] Core libraries missing — extension broken.");
    return;
  }

  let settings = { enabled: true, allowlist: [] };
  let sessionStats = { urlsCleaned: 0, paramsRemoved: 0 };

  // ---------------------------------------------------------------------------
  // Settings sync (live updates from popup)
  // ---------------------------------------------------------------------------
  function loadSettings() {
    chrome.storage.local.get(["enabled", "allowlist"], (data) => {
      settings.enabled = data.enabled !== false;
      settings.allowlist = Array.isArray(data.allowlist) ? data.allowlist : [];
    });
  }
  loadSettings();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if ("enabled" in changes) {
      settings.enabled = changes.enabled.newValue !== false;
    }
    if ("allowlist" in changes) {
      settings.allowlist = Array.isArray(changes.allowlist.newValue)
        ? changes.allowlist.newValue
        : [];
      // Re-rewrite all anchors (settings changed)
      rewriteAllAnchors(true);
    }
  });

  // ---------------------------------------------------------------------------
  // Anchor rewriting — mutate href so all paths (click, right-click, copy)
  // get the clean URL.
  // ---------------------------------------------------------------------------
  function rewriteAnchor(anchor, force) {
    if (!settings.enabled) return;
    if (!anchor || !anchor.href) return;
    if (!force && anchor.dataset.linkCleaned === "1") return;

    const original = anchor.getAttribute("href");
    if (!original) return;
    // Skip obviously empty / anchor / javascript links
    if (
      original.startsWith("#") ||
      original.startsWith("javascript:") ||
      original.startsWith("data:")
    ) {
      return;
    }

    const result = LC.cleanUrl(anchor.href, settings.allowlist);
    if (!result) return;
    if (!result.changed) {
      anchor.dataset.linkCleaned = "1";
      return;
    }

    // Preserve original for debugging
    anchor.dataset.linkOriginalHref = original;
    anchor.dataset.linkCleaned = "1";
    anchor.setAttribute("href", result.cleaned);

    if (!anchor.dataset.linkCleanedBy) {
      anchor.dataset.linkCleanedBy = "LinkCleaner";
      anchor.setAttribute(
        "title",
        (anchor.getAttribute("title") || anchor.textContent?.trim() || "Link") +
          " (cleaned by Link Cleaner)"
      );
    }
  }

  function rewriteAllAnchors(force) {
    if (!settings.enabled) return;
    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach((a) => rewriteAnchor(a, force));
  }

  // ---------------------------------------------------------------------------
  // Click interceptor — belt-and-suspenders, in case DOM mutation misses a link
  // ---------------------------------------------------------------------------
  document.addEventListener(
    "click",
    (e) => {
      if (!settings.enabled) return;
      const link = e.target.closest && e.target.closest("a[href]");
      if (!link) return;

      const original = link.href;
      const result = LC.cleanUrl(original, settings.allowlist);
      if (!result || !result.changed) return;

      // The href should already be cleaned by the mutation observer.
      // This guard catches the rare race where a user clicks before rewrite.
      e.preventDefault();
      e.stopPropagation();
      navigate(original, result.cleaned);
    },
    true
  );

  // ---------------------------------------------------------------------------
  // Intercept window.open (often used for tracking-pixel redirects, popup ads)
  // ---------------------------------------------------------------------------
  const originalOpen = window.open;
  window.open = function (url, ...rest) {
    if (url && settings.enabled) {
      const result = LC.cleanUrl(url, settings.allowlist);
      if (result && result.changed) url = result.cleaned;
    }
    return originalOpen.call(this, url, ...rest);
  };

  // ---------------------------------------------------------------------------
  // Intercept programmatic navigation: location.assign / location.replace
  // ---------------------------------------------------------------------------
  ["assign", "replace"].forEach((method) => {
    const original = window.location[method].bind(window.location);
    window.location[method] = function (url) {
      if (url && settings.enabled) {
        const result = LC.cleanUrl(url, settings.allowlist);
        if (result && result.changed) url = result.cleaned;
      }
      return original(url);
    };
  });

  function navigate(originalUrl, cleanedUrl) {
    sessionStats.urlsCleaned += 1;
    sessionStats.paramsRemoved += (cleanedUrl.match(/[?&]/g) || []).length;
    chrome.runtime.sendMessage(
      {
        type: "link-cleaned",
        original: originalUrl,
        cleaned: cleanedUrl,
      },
      () => void chrome.runtime.lastError
    );
    window.location.href = cleanedUrl;
  }

  // ---------------------------------------------------------------------------
  // Mutation observer — SPA / dynamic content / lazy-loaded lists
  // ---------------------------------------------------------------------------
  const observer = new MutationObserver((mutations) => {
    if (!settings.enabled) return;
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === "A" && node.href) {
          rewriteAnchor(node, false);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll("a[href]").forEach((a) => rewriteAnchor(a, false));
        }
      });
    }
  });

  function startObserver() {
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } else {
      // Document not ready yet — wait
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
          });
        },
        { once: true }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  function boot() {
    rewriteAllAnchors(true);
    startObserver();
    console.info(
      `[LinkCleaner] Active · ${LC.PARAM_COUNT} tracking params watched · ${settings.allowlist.length} allowlisted domains`
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
