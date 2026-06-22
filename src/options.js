/* Link Cleaner — Options Page Logic
   Tabs, settings load/save, custom rules preview, bulk cleaner,
   export/import.
*/

(function () {
  "use strict";
  const LC = window.LinkCleaner;
  if (!LC || !LC.cleanUrl) {
    document.body.textContent = "Link Cleaner core libraries missing.";
    return;
  }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================================================
  // Tabs
  // ============================================================================
  function activateTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    $$(".panel").forEach((p) => p.classList.toggle("active", p.id === name));
    if (history.replaceState) history.replaceState(null, "", `#${name}`);
  }

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      activateTab(tab.dataset.tab);
    });
  });
  // Open tab from URL hash if present
  if (location.hash) activateTab(location.hash.slice(1));

  // ============================================================================
  // Storage helpers
  // ============================================================================
  function getAll() {
    return new Promise((resolve) =>
      chrome.storage.local.get(
        ["enabled", "allowlist", "customStrip", "customKeep", "customPrefixes", "stats"],
        resolve
      )
    );
  }

  function setAll(patch) {
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

  // ============================================================================
  // General: toggle + stats
  // ============================================================================
  function loadGeneral(data) {
    $("#enabled-toggle").checked = data.enabled !== false;
    $("#param-count").textContent = LC.PARAM_COUNT;
    $("#param-count-2").textContent = LC.PARAM_COUNT;
    renderStats(data.stats);
  }

  function renderStats(stats) {
    $("#stat-urls").textContent = (stats?.totalUrlsCleaned || 0).toLocaleString();
    $("#stat-params").textContent = (stats?.totalParamsRemoved || 0).toLocaleString();
    $("#stat-cleanings").textContent = ((stats?.totalUrlsCleaned || 0)).toLocaleString();
  }

  $("#enabled-toggle").addEventListener("change", async (e) => {
    await setAll({ enabled: e.target.checked });
  });

  $("#reset-stats-btn").addEventListener("click", async () => {
    if (!confirm("Reset all stats? This cannot be undone.")) return;
    await setAll({
      stats: {
        totalUrlsCleaned: 0,
        totalParamsRemoved: 0,
        lastResetAt: new Date().toISOString(),
      },
    });
    renderStats({ totalUrlsCleaned: 0, totalParamsRemoved: 0 });
  });

  $("#reset-all-btn").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Reset ALL settings (toggle, allowlist, custom rules, stats)? This cannot be undone.")) return;
    await setAll({
      enabled: true,
      allowlist: [],
      customStrip: [],
      customKeep: [],
      customPrefixes: [],
      stats: { totalUrlsCleaned: 0, totalParamsRemoved: 0, lastResetAt: new Date().toISOString() },
    });
    location.reload();
  });

  // ============================================================================
  // Custom Rules
  // ============================================================================
  function parseTextarea(text) {
    return text
      .split("\n")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && !s.startsWith("#"));
  }

  function loadCustomRules(data) {
    const strip = Array.isArray(data.customStrip) ? data.customStrip : [];
    const keep = Array.isArray(data.customKeep) ? data.customKeep : [];
    const prefixes = Array.isArray(data.customPrefixes) ? data.customPrefixes : [];
    $("#custom-strip").value = strip.join("\n");
    $("#custom-keep").value = keep.join("\n");
    $("#custom-prefixes").value = prefixes.join("\n");
    $("#strip-count").textContent = strip.length;
    $("#keep-count").textContent = keep.length;
    $("#prefix-count").textContent = prefixes.length;
    // Apply to DB for live preview
    LC.setCustomRules({ strip, keep, prefixes });
  }

  function updateCounts() {
    $("#strip-count").textContent = parseTextarea($("#custom-strip").value).length;
    $("#keep-count").textContent = parseTextarea($("#custom-keep").value).length;
    $("#prefix-count").textContent = parseTextarea($("#custom-prefixes").value).length;
  }

  ["custom-strip", "custom-keep", "custom-prefixes"].forEach((id) => {
    $("#" + id).addEventListener("input", updateCounts);
  });

  // Live preview
  function updatePreview() {
    const url = $("#preview-url").value.trim();
    const resultEl = $("#preview-result");
    if (!url) {
      resultEl.innerHTML = '<span class="placeholder">Enter a URL above to preview</span>';
      resultEl.classList.remove("changed");
      return;
    }
    const result = LC.cleanUrl(url);
    if (!result) {
      resultEl.innerHTML = '<span style="color:var(--danger)">Invalid URL</span>';
      resultEl.classList.remove("changed");
      return;
    }
    if (!result.changed) {
      resultEl.innerHTML = `<span class="placeholder">No tracking params — already clean</span><br><code>${escapeHtml(result.cleaned)}</code>`;
      resultEl.classList.remove("changed");
      return;
    }
    const removedHtml = result.removed
      .map((p) => `<span class="removed">${escapeHtml(p)}</span>`)
      .join("");
    resultEl.innerHTML = `<strong>Cleaned:</strong> <code>${escapeHtml(result.cleaned)}</code><br><strong>Removed:</strong> ${removedHtml}`;
    resultEl.classList.add("changed");
  }

  $("#preview-url").addEventListener("input", updatePreview);

  $("#save-rules-btn").addEventListener("click", async () => {
    const strip = parseTextarea($("#custom-strip").value);
    const keep = parseTextarea($("#custom-keep").value);
    const prefixes = parseTextarea($("#custom-prefixes").value);

    // Validate prefixes (must end with _ ideally, warn if not)
    const badPrefixes = prefixes.filter((p) => !p.endsWith("_"));
    if (badPrefixes.length > 0) {
      const ok = confirm(
        `These prefixes don't end with "_" (recommended for clarity):\n  ${badPrefixes.join(", ")}\n\nSave anyway?`
      );
      if (!ok) return;
    }

    await setAll({
      customStrip: strip,
      customKeep: keep,
      customPrefixes: prefixes,
    });

    const status = $("#save-status");
    status.textContent = "✓ Saved";
    status.className = "save-status success";
    setTimeout(() => { status.textContent = ""; status.className = "save-status"; }, 2000);

    LC.setCustomRules({ strip, keep, prefixes });
    updateCounts();
    updatePreview();
  });

  // ============================================================================
  // Allowlist
  // ============================================================================
  function renderAllowlist(allowlist) {
    const list = $("#allowlist-list");
    list.innerHTML = "";
    if (!allowlist || allowlist.length === 0) return;

    allowlist.forEach((domain) => {
      const li = document.createElement("li");
      let typeLabel = "exact";
      if (domain.startsWith("*.")) typeLabel = "wildcard";
      else if (domain.startsWith(".")) typeLabel = "suffix";

      li.innerHTML = `
        <span><span class="pattern-type">${typeLabel}</span>${escapeHtml(domain)}</span>
        <button data-domain="${escapeHtml(domain)}" title="Remove">×</button>
      `;
      list.appendChild(li);
    });
    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cur = await getAll();
        const next = cur.allowlist.filter((d) => d !== btn.dataset.domain);
        await setAll({ allowlist: next });
        renderAllowlist(next);
      });
    });
  }

  function validateDomain(raw) {
    let domain = raw.trim().toLowerCase();
    if (!domain) return null;
    // Strip protocol if user pasted a URL
    try {
      if (domain.includes("://")) domain = new URL(domain).hostname.toLowerCase();
    } catch (_) {}
    // Remove path, leading www.
    domain = domain.replace(/^www\./, "").split("/")[0];
    // Allow wildcard prefix
    const wild = domain.startsWith("*.");
    const base = wild ? domain.slice(2) : (domain.startsWith(".") ? domain.slice(1) : domain);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(base)) return null;
    return wild ? "*." + base : (domain.startsWith(".") ? "." + base : domain);
  }

  $("#allowlist-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("#allowlist-input").value;
    const domain = validateDomain(raw);
    if (!domain) {
      $("#allowlist-input").style.borderColor = "var(--danger)";
      setTimeout(() => ($("#allowlist-input").style.borderColor = ""), 800);
      return;
    }
    const cur = await getAll();
    if (cur.allowlist.includes(domain)) return;
    const next = [...cur.allowlist, domain].sort();
    await setAll({ allowlist: next });
    $("#allowlist-input").value = "";
    renderAllowlist(next);
  });

  // ============================================================================
  // Bulk Cleaner
  // ============================================================================
  $("#bulk-process-btn").addEventListener("click", async () => {
    const input = $("#bulk-input").value;
    const urls = input.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 1000);
    if (urls.length === 0) {
      $("#bulk-info").textContent = "No URLs to process";
      return;
    }
    const data = await getAll();
    const allowlist = data.allowlist || [];
    LC.setCustomRules({
      strip: data.customStrip || [],
      keep: data.customKeep || [],
      prefixes: data.customPrefixes || [],
    });

    let cleaned = 0;
    let removed = 0;
    const out = urls.map((url) => {
      const r = LC.cleanUrl(url, allowlist);
      if (r && r.changed) {
        cleaned++;
        removed += r.removed.length;
        return r.cleaned;
      }
      return r ? r.cleaned : url;
    });

    $("#bulk-output").value = out.join("\n");
    $("#bulk-results-card").hidden = false;
    $("#bulk-info").textContent = `Processed ${urls.length} URLs`;
    $("#bulk-summary").textContent = `${cleaned} URLs had tracking params removed (${removed} params total).`;
  });

  $("#bulk-clear-btn").addEventListener("click", () => {
    $("#bulk-input").value = "";
    $("#bulk-output").value = "";
    $("#bulk-results-card").hidden = true;
    $("#bulk-info").textContent = "";
    $("#bulk-summary").textContent = "";
  });

  $("#bulk-copy-btn").addEventListener("click", async () => {
    const text = $("#bulk-output").value;
    try {
      await navigator.clipboard.writeText(text);
      flashButton("#bulk-copy-btn", "✓ Copied!");
    } catch (e) {
      const ta = $("#bulk-output");
      ta.select();
      document.execCommand("copy");
      flashButton("#bulk-copy-btn", "✓ Copied!");
    }
  });

  $("#bulk-download-btn").addEventListener("click", () => {
    const text = $("#bulk-output").value;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `link-cleaner-bulk-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ============================================================================
  // Backup: Export / Import
  // ============================================================================
  function setBackupStatus(msg, type = "") {
    const el = $("#backup-status");
    el.textContent = msg;
    el.style.color = type === "success" ? "var(--success)" :
                     type === "error" ? "var(--danger)" : "";
  }

  $("#export-btn").addEventListener("click", async () => {
    const data = await getAll();
    const exportObj = {
      _format: "link-cleaner-settings-v1",
      _exportedAt: new Date().toISOString(),
      enabled: data.enabled !== false,
      allowlist: Array.isArray(data.allowlist) ? data.allowlist : [],
      customStrip: Array.isArray(data.customStrip) ? data.customStrip : [],
      customKeep: Array.isArray(data.customKeep) ? data.customKeep : [],
      customPrefixes: Array.isArray(data.customPrefixes) ? data.customPrefixes : [],
      stats: data.stats || { totalUrlsCleaned: 0, totalParamsRemoved: 0 },
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `link-cleaner-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupStatus("✓ Exported to " + a.download, "success");
  });

  $("#import-btn").addEventListener("click", () => $("#import-file").click());

  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const obj = JSON.parse(text);

      // Validate format
      if (obj._format !== "link-cleaner-settings-v1") {
        throw new Error("Not a Link Cleaner settings file (missing _format field)");
      }

      // Validate each field
      const patch = {};
      if (typeof obj.enabled === "boolean") patch.enabled = obj.enabled;
      if (Array.isArray(obj.allowlist)) patch.allowlist = obj.allowlist;
      if (Array.isArray(obj.customStrip)) patch.customStrip = obj.customStrip;
      if (Array.isArray(obj.customKeep)) patch.customKeep = obj.customKeep;
      if (Array.isArray(obj.customPrefixes)) patch.customPrefixes = obj.customPrefixes;
      if (obj.stats && typeof obj.stats === "object") patch.stats = obj.stats;

      await setAll(patch);
      setBackupStatus(`✓ Imported ${file.name}. Reloading…`, "success");
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      setBackupStatus(`✗ Import failed: ${err.message}`, "error");
    } finally {
      e.target.value = ""; // allow re-importing same file
    }
  });

  // ============================================================================
  // Helpers
  // ============================================================================
  function flashButton(sel, msg) {
    const el = $(sel);
    if (!el) return;
    const orig = el.textContent;
    el.textContent = msg;
    el.disabled = true;
    setTimeout(() => { el.textContent = orig; el.disabled = false; }, 1200);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ============================================================================
  // Boot
  // ============================================================================
  document.addEventListener("DOMContentLoaded", async () => {
    const data = await getAll();
    loadGeneral(data);
    loadCustomRules(data);
    renderAllowlist(data.allowlist || []);
    updatePreview();
  });
})();
