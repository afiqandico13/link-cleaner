/* Link Cleaner — Options Page Logic
   Tabs, settings load/save, custom rules preview, bulk cleaner,
   export/import.
*/

(function () {
  "use strict";
  const LC = window.LinkCleaner;
  const i18n = (window.LinkCleaner && window.LinkCleaner.i18n) || null;
  const t = i18n ? i18n.t : (k) => k;
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
        ["enabled", "allowlist", "customStrip", "customKeep", "customPrefixes", "perDomainRules", "stats"],
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
    renderChart(stats?.daily || {});
  }

  function renderChart(daily) {
    const svg = $("#chart");
    if (!svg) return;
    // Build last 7 days (oldest → newest)
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = daily[key] || { urls: 0, params: 0 };
      days.push({ date: key, urls: entry.urls || 0, params: entry.params || 0 });
    }

    const max = Math.max(1, ...days.map((d) => d.urls), ...days.map((d) => d.params));
    const W = 700, H = 200;
    const padL = 30, padR = 16, padT = 12, padB = 30;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const barGroupW = innerW / 7;
    const barW = barGroupW * 0.36;
    const gap = barGroupW * 0.08;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const parts = [];

    // Y-axis grid lines (5 levels)
    for (let i = 0; i <= 4; i++) {
      const y = padT + (innerH * i / 4);
      const v = Math.round(max * (1 - i / 4));
      parts.push(`<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.08" stroke-width="1" />`);
      parts.push(`<text x="${padL - 4}" y="${y + 3}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.5">${v}</text>`);
    }

    days.forEach((d, i) => {
      const cx = padL + barGroupW * i + barGroupW / 2;
      const urlH = (d.urls / max) * innerH;
      const paramH = (d.params / max) * innerH;
      const urlX = cx - barW - gap / 2;
      const paramX = cx + gap / 2;
      const colorUrl = "#6d28d9";
      const colorParam = "#a78bfa";

      // Bars (rounded top corners via rect)
      if (d.urls > 0) {
        parts.push(`<rect x="${urlX}" y="${padT + innerH - urlH}" width="${barW}" height="${urlH}" fill="${colorUrl}" rx="2" ry="2"><title>${d.date}: ${d.urls} URLs</title></rect>`);
      }
      if (d.params > 0) {
        parts.push(`<rect x="${paramX}" y="${padT + innerH - paramH}" width="${barW}" height="${paramH}" fill="${colorParam}" rx="2" ry="2"><title>${d.date}: ${d.params} params</title></rect>`);
      }

      // Day label
      const date = new Date(d.date);
      const dayName = dayNames[date.getDay()];
      parts.push(`<text x="${cx}" y="${H - padB + 14}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.7">${dayName}</text>`);
      parts.push(`<text x="${cx}" y="${H - padB + 25}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.4">${date.getDate()}</text>`);
    });

    svg.innerHTML = parts.join("");

    // Summary
    const totalUrls = days.reduce((a, d) => a + d.urls, 0);
    const totalParams = days.reduce((a, d) => a + d.params, 0);
    const summary = $("#chart-summary");
    if (summary) {
      summary.textContent = `Last 7 days: ${totalUrls} URLs cleaned, ${totalParams} params removed`;
    }
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
    if (!confirm("Reset ALL settings (toggle, allowlist, custom rules, per-domain rules, stats)? This cannot be undone.")) return;
    await setAll({
      enabled: true,
      allowlist: [],
      customStrip: [],
      customKeep: [],
      customPrefixes: [],
      perDomainRules: {},
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
  // Per-domain Rules
  // ============================================================================
  function renderPerDomain(rules) {
    const list = $("#perdomain-list");
    list.innerHTML = "";
    const entries = Object.entries(rules || {});
    if (entries.length === 0) {
      list.style.display = "none";
      return;
    }
    list.style.display = "flex";
    entries.forEach(([pattern, ruleData]) => {
      const item = document.createElement("div");
      item.className = "perdomain-item";
      item.innerHTML = `
        <div class="perdomain-item-head">
          <span class="perdomain-pattern">${escapeHtml(pattern)}</span>
          <button class="remove" data-pattern="${escapeHtml(pattern)}" title="Remove rule">×</button>
        </div>
        <div class="perdomain-fields">
          <div class="perdomain-field">
            <label>Always strip (one per line)</label>
            <textarea data-field="strip" data-pattern="${escapeHtml(pattern)}" rows="3">${escapeHtml((ruleData.strip || []).join("\n"))}</textarea>
          </div>
          <div class="perdomain-field">
            <label>Never strip (one per line)</label>
            <textarea data-field="keep" data-pattern="${escapeHtml(pattern)}" rows="3">${escapeHtml((ruleData.keep || []).join("\n"))}</textarea>
          </div>
          <div class="perdomain-field">
            <label>Custom prefixes (one per line)</label>
            <textarea data-field="prefixes" data-pattern="${escapeHtml(pattern)}" rows="3">${escapeHtml((ruleData.prefixes || []).join("\n"))}</textarea>
          </div>
        </div>
      `;
      list.appendChild(item);
    });

    // Remove handler
    list.querySelectorAll("button.remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cur = await getAll();
        const next = { ...cur.perDomainRules };
        delete next[btn.dataset.pattern];
        await setAll({ perDomainRules: next });
        renderPerDomain(next);
      });
    });

    // Auto-save on textarea change (debounced)
    list.querySelectorAll("textarea").forEach((ta) => {
      let timer = null;
      ta.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const cur = await getAll();
          const pattern = ta.dataset.pattern;
          const field = ta.dataset.field;
          const values = parseTextarea(ta.value);
          const next = {
            ...cur.perDomainRules,
            [pattern]: {
              ...(cur.perDomainRules[pattern] || {}),
              [field]: values,
            },
          };
          await setAll({ perDomainRules: next });
        }, 400);
      });
    });
  }

  $("#add-perdomain-btn").addEventListener("click", async () => {
    const pattern = $("#perdomain-pattern").value.trim().toLowerCase();
    const valid = validateDomain(pattern);
    if (!valid) {
      $("#perdomain-pattern").style.borderColor = "var(--danger)";
      setTimeout(() => ($("#perdomain-pattern").style.borderColor = ""), 800);
      return;
    }
    const cur = await getAll();
    if (cur.perDomainRules && cur.perDomainRules[valid]) {
      flashButton("#add-perdomain-btn", "✓ Exists");
      return;
    }
    const next = {
      ...(cur.perDomainRules || {}),
      [valid]: { strip: [], keep: [], prefixes: [] },
    };
    await setAll({ perDomainRules: next });
    $("#perdomain-pattern").value = "";
    renderPerDomain(next);
  });

  $("#perdomain-pattern").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("#add-perdomain-btn").click();
    }
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
    renderPerDomain(data.perDomainRules || {});
    updatePreview();
  });
})();
