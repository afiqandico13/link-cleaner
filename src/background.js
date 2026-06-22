/* Link Cleaner — Background Service Worker (MV3)
   - Initializes default settings on install
   - Aggregates session stats (URLs cleaned, params removed)
   - Listens for messages from content scripts
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
    // Increment all-time counters
    chrome.storage.local.get(["stats"], (data) => {
      const stats = data.stats || DEFAULTS.stats;
      stats.totalUrlsCleaned = (stats.totalUrlsCleaned || 0) + 1;
      const paramsInUrl = (msg.original.match(/[?&]([^=&]+)/g) || []).length -
                          (msg.cleaned.match(/[?&]([^=&]+)/g) || []).length;
      stats.totalParamsRemoved = (stats.totalParamsRemoved || 0) + Math.max(0, paramsInUrl);
      chrome.storage.local.set({ stats });
    });
  }

  if (msg.type === "cleanable-count") {
    // Update page action badge with cleanable links count for current tab
    const tabId = sender.tab?.id;
    if (tabId != null && msg.count > 0) {
      const text = msg.count > 99 ? "99+" : String(msg.count);
      chrome.action.setBadgeText({ tabId, text });
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#6d28d9" });
    } else if (tabId != null) {
      chrome.action.setBadgeText({ tabId, text: "" });
    }
  }
});

// ---- Keyboard command: clean current tab URL ----
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "clean-current-tab") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;
    // Strip tracking via injected content script logic
    // (chrome.tabs.update with the cleaned URL)
    // For simplicity, just open popup — actual cleaning is content-script work
    chrome.action.openPopup?.();
  });
}
