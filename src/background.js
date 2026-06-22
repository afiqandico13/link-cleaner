/* Link Cleaner — Background Service Worker (MV3)
   - Initializes default settings on install
   - Aggregates session stats (URLs cleaned, params removed)
   - Listens for messages from content scripts
   - Handles keyboard commands
*/
"use strict";

const DEFAULTS = {
  enabled: true,
  allowlist: [],
  stats: {
    totalUrlsCleaned: 0,
    totalParamsRemoved: 0,
    lastResetAt: null,
  },
};

// ---- Install / Update ----
chrome.runtime.onInstalled.addListener(async (details) => {
  const data = await chrome.storage.local.get(["enabled", "allowlist", "stats"]);
  const updates = {};
  if (data.enabled === undefined) updates.enabled = DEFAULTS.enabled;
  if (!Array.isArray(data.allowlist)) updates.allowlist = DEFAULTS.allowlist;
  if (!data.stats) updates.stats = DEFAULTS.stats;
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
  console.info("[LinkCleaner] installed/updated:", details.reason);
});

// ---- Listen for messages from content scripts ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "link-cleaned") {
    // Increment all-time counters + today's per-day counter
    chrome.storage.local.get(["stats"], (data) => {
      const stats = data.stats || DEFAULTS.stats;
      stats.totalUrlsCleaned = (stats.totalUrlsCleaned || 0) + 1;
      const paramsInUrl = (msg.original.match(/[?&]([^=&]+)/g) || []).length -
                          (msg.cleaned.match(/[?&]([^=&]+)/g) || []).length;
      stats.totalParamsRemoved = (stats.totalParamsRemoved || 0) + Math.max(0, paramsInUrl);

      // Per-day tracking for the 7-day chart
      const today = new Date().toISOString().slice(0, 10);
      stats.daily = stats.daily || {};
      stats.daily[today] = stats.daily[today] || { urls: 0, params: 0 };
      stats.daily[today].urls = (stats.daily[today].urls || 0) + 1;
      stats.daily[today].params = (stats.daily[today].params || 0) + Math.max(0, paramsInUrl);

      // Prune old entries (keep last 30 days)
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      Object.keys(stats.daily).forEach((d) => {
        if (new Date(d).getTime() < cutoff) delete stats.daily[d];
      });

      chrome.storage.local.set({ stats });
    });
  }

  if (msg.type === "cleanable-count") {
    // Update page action badge with cleanable links count for current tab
    const tabId = sender.tab && sender.tab.id;
    if (tabId != null) {
      if (msg.count > 0) {
        const text = msg.count > 99 ? "99+" : String(msg.count);
        const color = msg.allowlisted ? "#9ca3af" : "#6d28d9"; // gray if disabled here, purple otherwise
        chrome.action.setBadgeText({ tabId: tabId, text: text });
        chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: color });
      } else if (msg.allowlisted) {
        // On allowlisted domain: show "✓" checkmark to indicate "no cleaning here"
        chrome.action.setBadgeText({ tabId: tabId, text: "✓" });
        chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#9ca3af" });
      } else {
        chrome.action.setBadgeText({ tabId: tabId, text: "" });
      }
    }
  }
});

// ---- Keyboard commands ----
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-cleaning") {
      const data = await chrome.storage.local.get(["enabled"]);
      const newValue = !(data.enabled !== false);
      await chrome.storage.local.set({ enabled: newValue });
      console.info("[LinkCleaner] cleaning " + (newValue ? "ENABLED" : "DISABLED") + " via shortcut");
    }
    if (command === "clean-current-tab") {
      if (chrome.action.openPopup) {
        chrome.action.openPopup();
      }
    }
  });
}
