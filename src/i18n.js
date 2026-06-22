/* Link Cleaner — Internationalization (i18n)
   Tiny i18n with English (default) + Indonesian. Auto-detects browser locale.
   API: t(key, ...args) — same as console.log-style formatting (%s, %d).
*/

(function () {
  "use strict";

  const STRINGS = {
    en: {
      // Popup
      "popup.title": "Link Cleaner",
      "popup.subtitle": "Strip tracking params before navigation",
      "popup.enable": "Enable cleaning",
      "popup.enable.sub": "Apply on every page automatically",
      "popup.currentTab": "Current tab",
      "popup.original": "Original",
      "popup.cleaned": "Cleaned",
      "popup.copy": "📋 Copy cleaned",
      "popup.navigate": "↗ Open cleaned",
      "popup.stats": "Stats",
      "popup.reset": "Reset",
      "popup.urlsCleaned": "URLs cleaned",
      "popup.paramsRemoved": "Params removed",
      "popup.allowlist": "Allowlist",
      "popup.allowlist.help": "Domains where cleaning is disabled (e.g., your own analytics).",
      "popup.allowlist.placeholder": "example.com",
      "popup.watching": "Watching %s trackers",
      "popup.viewAll": "View full list",
      "popup.noParams": "No tracking params detected",
      "popup.alreadyClean": "Already clean",
      "popup.copied": "✓ Copied!",
      "popup.openOptions": "⚙️ Open full settings",

      // Options
      "options.subtitle": "Full settings — popup gives quick toggle only",
      "options.tab.general": "General",
      "options.tab.rules": "Custom Rules",
      "options.tab.allowlist": "Allowlist",
      "options.tab.bulk": "Bulk Cleaner",
      "options.tab.backup": "Backup",
      "options.tab.about": "About",
      "options.stats.title": "All-time stats",
      "options.stats.urls": "URLs cleaned",
      "options.stats.params": "Params removed",
      "options.stats.cleanings": "Cleanings",
      "options.stats.reset": "Reset stats",
      "options.stats.chart": "Last 7 days",
      "options.rules.strip": "Always strip",
      "options.rules.keep": "Never strip",
      "options.rules.prefixes": "Custom prefixes",
      "options.rules.help": "One per line, lowercase. Changes apply on save.",
      "options.rules.preview": "Preview",
      "options.rules.preview.help": "Test your custom rules against a URL",
      "options.rules.save": "Save custom rules",
      "options.rules.saved": "✓ Saved",
      "options.perDomain.title": "Per-domain rules",
      "options.perDomain.help": "Override global rules for specific domains.",
      "options.perDomain.add": "Add per-domain rule",
      "options.bulk.title": "Bulk URL Cleaner",
      "options.bulk.help": "Paste URLs (one per line) and get cleaned versions. Up to 1000 at a time.",
      "options.bulk.process": "Process",
      "options.bulk.clear": "Clear",
      "options.bulk.results": "Results",
      "options.bulk.copy": "Copy all",
      "options.bulk.download": "Download .txt",
      "options.bulk.summary": "%s URLs had tracking params removed (%s params total).",
      "options.backup.title": "Backup & Sync",
      "options.backup.help": "Export your settings to a JSON file, or import from one. Useful for syncing across devices.",
      "options.backup.export": "Export to JSON",
      "options.backup.import": "Import from JSON",
      "options.backup.exported": "✓ Exported to %s",
      "options.backup.imported": "✓ Imported %s. Reloading…",
      "options.backup.error": "✗ Import failed: %s",
      "options.backup.whatsExported": "What's exported",
      "options.about.howItWorks": "How it works",
      "options.about.howItWorks.body": "Content scripts run on every page. They intercept link clicks, rewrite anchor href attributes, and watch for new links via MutationObserver. When you click a link, the tracking params have already been stripped — you navigate to a clean URL.",
      "options.about.howItWorks.storage": "Settings are stored locally (chrome.storage.local) and sync live to all open tabs. No data leaves your browser.",
      "options.footer.resetAll": "Reset everything to defaults",
      "options.footer.version": "Link Cleaner v%s",

      // Common
      "common.saved": "✓ Saved",
      "common.error": "Error",
      "common.loading": "loading…",
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
      "common.processing": "Processing…",
    },
    id: {
      // Popup
      "popup.title": "Link Cleaner",
      "popup.subtitle": "Hapus parameter tracking sebelum navigasi",
      "popup.enable": "Aktifkan pembersihan",
      "popup.enable.sub": "Terapkan otomatis di setiap halaman",
      "popup.currentTab": "Tab saat ini",
      "popup.original": "Asli",
      "popup.cleaned": "Bersih",
      "popup.copy": "📋 Salin URL bersih",
      "popup.navigate": "↗ Buka URL bersih",
      "popup.stats": "Statistik",
      "popup.reset": "Reset",
      "popup.urlsCleaned": "URL dibersihkan",
      "popup.paramsRemoved": "Param dihapus",
      "popup.allowlist": "Allowlist",
      "popup.allowlist.help": "Domain yang dikecualikan dari pembersihan (misal analytics sendiri).",
      "popup.allowlist.placeholder": "contoh.com",
      "popup.watching": "Memantau %s tracker",
      "popup.viewAll": "Lihat daftar lengkap",
      "popup.noParams": "Tidak ada param tracking terdeteksi",
      "popup.alreadyClean": "Sudah bersih",
      "popup.copied": "✓ Tersalin!",
      "popup.openOptions": "⚙️ Buka pengaturan lengkap",

      // Options
      "options.subtitle": "Pengaturan lengkap — popup hanya untuk toggle cepat",
      "options.tab.general": "Umum",
      "options.tab.rules": "Aturan Custom",
      "options.tab.allowlist": "Allowlist",
      "options.tab.bulk": "Bulk Cleaner",
      "options.tab.backup": "Backup",
      "options.tab.about": "Tentang",
      "options.stats.title": "Statistik sepanjang waktu",
      "options.stats.urls": "URL dibersihkan",
      "options.stats.params": "Param dihapus",
      "options.stats.cleanings": "Cleaning",
      "options.stats.reset": "Reset statistik",
      "options.stats.chart": "7 hari terakhir",
      "options.rules.strip": "Selalu hapus",
      "options.rules.keep": "Jangan pernah hapus",
      "options.rules.prefixes": "Prefix custom",
      "options.rules.help": "Satu per baris, huruf kecil. Perubahan berlaku setelah simpan.",
      "options.rules.preview": "Preview",
      "options.rules.preview.help": "Uji aturan custom terhadap URL",
      "options.rules.save": "Simpan aturan",
      "options.rules.saved": "✓ Tersimpan",
      "options.perDomain.title": "Aturan per-domain",
      "options.perDomain.help": "Override aturan global untuk domain tertentu.",
      "options.perDomain.add": "Tambah aturan per-domain",
      "options.bulk.title": "Bulk URL Cleaner",
      "options.bulk.help": "Paste URL (satu per baris) dan dapatkan versi bersih. Maks 1000 sekaligus.",
      "options.bulk.process": "Proses",
      "options.bulk.clear": "Hapus",
      "options.bulk.results": "Hasil",
      "options.bulk.copy": "Salin semua",
      "options.bulk.download": "Download .txt",
      "options.bulk.summary": "%s URL memiliki param tracking dihapus (%s param total).",
      "options.backup.title": "Backup & Sync",
      "options.backup.help": "Export pengaturan ke file JSON, atau import dari file. Berguna untuk sinkronisasi antar device.",
      "options.backup.export": "Export ke JSON",
      "options.backup.import": "Import dari JSON",
      "options.backup.exported": "✓ Di-export ke %s",
      "options.backup.imported": "✓ %s di-import. Memuat ulang…",
      "options.backup.error": "✗ Import gagal: %s",
      "options.backup.whatsExported": "Yang di-export",
      "options.about.howItWorks": "Cara kerja",
      "options.about.howItWorks.body": "Content script berjalan di setiap halaman. Mereka intercept klik link, rewrite atribut href anchor, dan pantau link baru via MutationObserver. Saat kamu klik link, param tracking sudah dihapus — kamu navigasi ke URL bersih.",
      "options.about.howItWorks.storage": "Pengaturan disimpan lokal (chrome.storage.local) dan sync langsung ke semua tab terbuka. Tidak ada data yang keluar dari browser.",
      "options.footer.resetAll": "Reset semua ke default",
      "options.footer.version": "Link Cleaner v%s",

      // Common
      "common.saved": "✓ Tersimpan",
      "common.error": "Error",
      "common.loading": "memuat…",
      "common.cancel": "Batal",
      "common.confirm": "Konfirmasi",
      "common.processing": "Memproses…",
    },
  };

  /**
   * Get the active locale (browser language, falls back to en).
   */
  function getLocale() {
    let lang = "en";
    try {
      if (typeof navigator !== "undefined" && navigator.language) {
        lang = navigator.language.toLowerCase().split("-")[0];
      }
    } catch (_) { /* ignore */ }
    return STRINGS[lang] ? lang : "en";
  }

  /**
   * Format a string with positional %s, %d placeholders.
   */
  function format(str, args) {
    let i = 0;
    return str.replace(/%[sd]/g, () => args[i++] ?? "");
  }

  /**
   * Translate a key, substituting args for %s/%d placeholders.
   * Falls back to English, then to the key itself.
   */
  function t(key, ...args) {
    const locale = getLocale();
    const str = (STRINGS[locale] && STRINGS[locale][key])
             || (STRINGS.en && STRINGS.en[key])
             || key;
    return args.length > 0 ? format(str, args) : str;
  }

  // Export
  window.LinkCleaner = window.LinkCleaner || {};
  window.LinkCleaner.i18n = { t, getLocale, STRINGS };
})();
