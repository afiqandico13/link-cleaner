/* Link Cleaner — Popup Logic
   - Renders current tab URL + cleaned preview
   - Wires up: toggle, copy/navigate buttons, allowlist editor, stats
*/

(function () {
  "use strict";
  const LC = window.LinkCleaner;
  if (!LC || !LC.cleanUrl) {
    console.warn("[LinkCleaner popup] cleanUrl missing");
    return;
  }

  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------------------
  // Settings + storage helpers
  // ---------------------------------------------------------------------------
  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["enabled", "allowlist", "customStrip", "customKeep", "customPrefixes", "perDomainRules"], (data) => {
        resolve({
          enabled: data.enabled !== false,
          allowlist: Array.isArray(data.allowlist) ? data.allowlist : [],
          customRules: {
            strip: Array.isArray(data.customStrip) ? data.customStrip : [],
            keep: Array.isArray(data.customKeep) ? data.customKeep : [],
            prefixes: Array.isArray(data.customPrefixes) ? data.customPrefixes : [],
          },
          perDomainRules: (data.perDomainRules && typeof data.perDomainRules === "object") ? data.perDomainRules : {},
        });
      });
    });
  }

  function saveSettings(patch) {
    return new Promise((resolve) => chrome.storage.local.set(patch, resolve));
  }

  function getStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["stats"], (data) => {
        resolve(
          data.stats || {
            totalUrlsCleaned: 0,
            totalParamsRemoved: 0,
            lastResetAt: null,
          }
        );
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  function renderCurrentTab(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const url = tab?.url || "(no URL)";
      $("#original-url").textContent = url;

      const result = LC.cleanUrl(url, settings.allowlist, null, settings.customRules, settings.perDomainRules);
      const cleanedEl = $("#cleaned-url");
      const removedEl = $("#removed-params");

      if (!result || !result.changed) {
        cleanedEl.textContent = result ? result.cleaned : url;
        cleanedEl.classList.add("no-change");
        removedEl.innerHTML = '<span style="color:var(--text-dim)">No tracking params detected</span>';
      } else {
        cleanedEl.textContent = result.cleaned;
        cleanedEl.classList.remove("no-change");
        removedEl.innerHTML =
          '<span>Removed:</span> ' +
          result.removed.map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join("");
      }

      // Cache for navigate
      cleanedEl.dataset.cleaned = result ? result.cleaned : url;
      cleanedEl.dataset.changed = result && result.changed ? "1" : "0";
    });
  }

  function renderStats() {
    getStats().then((stats) => {
      $("#stat-urls").textContent = (stats.totalUrlsCleaned || 0).toLocaleString();
      $("#stat-params").textContent = (stats.totalParamsRemoved || 0).toLocaleString();
    });
  }

  function renderAllowlist(settings) {
    const list = $("#allowlist-list");
    list.innerHTML = "";
    if (!settings.allowlist || settings.allowlist.length === 0) {
      list.style.display = "none";
      return;
    }
    list.style.display = "flex";
    settings.allowlist.forEach((domain) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHtml(domain)}</span><button data-domain="${escapeHtml(domain)}" title="Remove">×</button>`;
      list.appendChild(li);
    });
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.domain;
        const cur = await getSettings();
        const next = cur.allowlist.filter((d) => d !== domain);
        await saveSettings({ allowlist: next });
        renderAllowlist({ allowlist: next });
        renderCurrentTab({ allowlist: next });
      });
    });
  }

  function renderParamGrid() {
    const grid = $("#param-grid");
    const params = Array.from(LC.PARAMS || []).sort();
    $("#param-count").textContent = params.length;
    grid.innerHTML = params.join(" · ");
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------
  function wireToggle(settings) {
    const toggle = $("#enabled-toggle");
    toggle.checked = settings.enabled;
    toggle.addEventListener("change", async () => {
      await saveSettings({ enabled: toggle.checked });
      renderCurrentTab({ ...settings, enabled: toggle.checked });
    });
  }

  function wireCopy() {
    $("#copy-btn").addEventListener("click", async () => {
      const cleaned = $("#cleaned-url").dataset.cleaned;
      try {
        await navigator.clipboard.writeText(cleaned);
        flashButton("#copy-btn", "✓ Copied!");
      } catch (e) {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = cleaned;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        flashButton("#copy-btn", "✓ Copied!");
      }
    });
  }

  function wireNavigate() {
    $("#navigate-btn").addEventListener("click", () => {
      const changed = $("#cleaned-url").dataset.changed === "1";
      const cleaned = $("#cleaned-url").dataset.cleaned;
      if (!changed) {
        flashButton("#navigate-btn", "Already clean");
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab) chrome.tabs.update(tab.id, { url: cleaned });
      });
    });
  }

  function wireAllowlist() {
    const form = $("#allowlist-form");
    const input = $("#allowlist-input");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const raw = input.value.trim().toLowerCase();
      // Validate: strip protocol/path, keep just hostname
      let domain = raw;
      try {
        if (raw.includes("://")) {
          domain = new URL(raw).hostname.toLowerCase();
        }
        domain = domain.replace(/^www\./, "").split("/")[0];
      } catch (_) { /* keep raw */ }
      if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
        flashInput(input);
        return;
      }
      const cur = await getSettings();
      if (cur.allowlist.includes(domain)) {
        flashInput(input);
        return;
      }
      const next = [...cur.allowlist, domain].sort();
      await saveSettings({ allowlist: next });
      input.value = "";
      renderAllowlist({ allowlist: next });
      renderCurrentTab({ allowlist: next });
    });
  }

  function wireResetStats() {
    $("#reset-stats-btn").addEventListener("click", async () => {
      await saveSettings({
        stats: {
          totalUrlsCleaned: 0,
          totalParamsRemoved: 0,
          lastResetAt: new Date().toISOString(),
        },
      });
      renderStats();
    });
  }

  // ---------------------------------------------------------------------------
  // UX helpers
  // ---------------------------------------------------------------------------
  function flashButton(sel, msg) {
    const el = $(sel);
    const orig = el.textContent;
    el.textContent = msg;
    el.disabled = true;
    setTimeout(() => {
      el.textContent = orig;
      el.disabled = false;
    }, 1200);
  }

  function flashInput(el) {
    const orig = el.style.borderColor;
    el.style.borderColor = "var(--danger)";
    setTimeout(() => {
      el.style.borderColor = orig;
    }, 600);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    const settings = await getSettings();
    wireToggle(settings);
    wireCopy();
    wireNavigate();
    wireAllowlist();
    wireResetStats();
    wireOptionsLink();
    renderCurrentTab(settings);
    renderStats();
    renderAllowlist(settings);
    renderParamGrid();
  });

  function wireOptionsLink() {
    const link = document.getElementById("open-options");
    if (!link) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/options.html") });
      }
    });
  }
})();
