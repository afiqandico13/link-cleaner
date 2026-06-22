# Chrome Web Store & Firefox AMO Submission Guide

Everything needed to publish Link Cleaner to the Chrome Web Store and Firefox
Add-ons (AMO). This is a complete, copy-paste-ready submission kit.

---

## 📋 Store submission overview

| Store | Fee | Review | Setup link |
|---|---|---|---|
| **Chrome Web Store** | $5 one-time | 1-3 days | https://chrome.google.com/webstore/devconsole/ |
| **Firefox AMO** | FREE | 1-7 days | https://addons.mozilla.org/developers/ |
| **Edge Add-ons** | FREE | 1-3 days | https://partner.microsoft.com/dashboard/microsoftedge/ |
| **Safari** | $99/year | Xcode-only | https://developer.apple.com/ |

---

## 🖼️ Store assets (ready to use)

All required assets are in `screenshots/`:

| Asset | File | Dimensions | Status |
|---|---|---|---|
| Small tile | `screenshots/store-banner-440x280.png` | 440×280 | ✅ |
| Large tile | `screenshots/store-banner-1400x560.png` | 1400×560 | ✅ |
| Marquee | `screenshots/store-marquee-1400x560.png` | 1400×560 | ✅ |
| Screenshot 1 | `screenshots/store-screenshot-popup.png` | 1280×800 | ✅ |
| Screenshot 2 | `screenshots/store-screenshot-options.png` | 1280×800 | ✅ |
| Screenshot 3 | `screenshots/store-screenshot-bulk.png` | 1280×800 | ✅ |
| Real popup | `screenshots/real-screenshot-popup.png` | 1280×800 | ✅ |
| Real options | `screenshots/real-screenshot-options.png` | 1280×800 | ✅ |

**Screenshots recommended captions** (shown in store listing):
1. "Popup shows cleaned URL with diff — copy or open in one click"
2. "Options page: 7 tabs for full customization (rules, allowlist, per-domain)"
3. "Bulk URL cleaner — paste up to 1000 URLs at once"
4. "Statistics dashboard with 7-day chart"

---

## 📝 Listing text (copy-paste ready)

### Name (≤ 75 chars)
```
Link Cleaner — Strip Tracking Params
```

### Short description (Chrome: ≤ 132 chars)
```
Privacy-first browser extension that strips 88 tracking parameters from URLs
before you navigate. Zero data collection. Works offline.
```

### Detailed description (English)

```
Link Cleaner is a privacy-first browser extension that automatically removes
tracking parameters from URLs before you click them. Zero data collection —
everything runs locally in your browser.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHY USE LINK CLEANER?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every link you click is a tracking opportunity. `utm_source=newsletter`,
`fbclid=IwAR...`, `gclid=...`, `igshid=...` — these tell Google, Facebook,
and 30+ other platforms exactly where you came from and what you clicked.

Link Cleaner strips them silently before navigation. You click; the tracker
sees a direct visit; nothing leaves your browser.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PRIVACY-FIRST
• Strips 88 tracking parameters from Google, Facebook, Instagram, TikTok,
  Twitter/X, LinkedIn, Microsoft, Mailchimp, HubSpot, Marketo, Pinterest,
  Klaviyo, Matomo, Outbrain, Bing, Yandex, Quora, Reddit, Snap + 30 more
• Prefix matching catches future variants (`utm_*`, `fb_*`, `_hs*`, `__hs*`)
• Zero data collection — no analytics, no telemetry, no remote calls
• All processing happens locally on your device
• Open source (MIT) — read every line of code

⚡ ZERO-CONFIG
• Install and forget — works on every site automatically
• Rewrites anchor href attributes — right-click "Copy link" also gives you
  the clean URL
• Handles SPAs and dynamically-loaded content via MutationObserver
• Intercepts programmatic navigation (window.open, location.assign)

🎯 POWERFUL CUSTOMIZATION
• Wildcard allowlist: disable cleaning for specific domains
  • `example.com` — exact match
  • `*.example.com` — any subdomain
  • `.example.com` — apex + all subdomains
• Per-rule parameter overrides:
  • Always strip — add your own tracking params to strip
  • Never strip — protect specific params from being stripped
  • Custom prefixes — strip any param matching your prefix (e.g., `myapp_*`)
• Per-domain rule overrides — domain-specific strip/keep/prefixes that
  REPLACE global rules when the URL matches
• Bulk URL cleaner — paste up to 1000 URLs and get cleaned versions
• Export/import settings to/from JSON — cross-device sync

📊 STATS DASHBOARD
• Live count of cleanable links on each page (toolbar icon badge)
• All-time statistics: URLs cleaned, params removed
• 7-day bar chart showing daily activity
• Reset stats anytime

🎨 POLISHED UI
• Dark-mode aware (respects prefers-color-scheme)
• Keyboard shortcuts:
  • Ctrl+Shift+L — open popup
  • Ctrl+Shift+T — toggle cleaning on/off
  • Ctrl+Shift+C — open popup with clean-tab action
• Cross-browser: Chrome, Edge, Brave, Firefox 109+, Safari 15.4+

🌍 MULTI-LANGUAGE
• English + Indonesian (auto-detects browser locale)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Content scripts run on every page you visit
2. They intercept link clicks, rewrite anchor href attributes, and watch for
   new links via MutationObserver
3. When you click a link, the tracking parameters have already been stripped
4. You navigate to a clean URL — no tracking, no analytics
5. The toolbar icon shows a live count of cleanable links on the current page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERMISSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• storage — save your settings and stats locally
• activeTab — read the current tab's URL when you click the popup icon
• <all_urls> — inject the content script on every page to intercept clicks

We do NOT request: tabs, cookies, history, clipboardWrite, notifications,
webRequest, or any other sensitive permission. See PRIVACY.md for full
details.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPEN SOURCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Link Cleaner is open source under the MIT license.

🌐 GitHub: https://github.com/afiqandico13/link-cleaner
📦 Issues: https://github.com/afiqandico13/link-cleaner/issues
📄 License: MIT
👤 Author: Afiq Andico Pangimpian (@afiqandico13)
```

### Detailed description (Indonesian / Bahasa Indonesia)

```
Link Cleaner adalah ekstensi browser privacy-first yang secara otomatis
menghapus parameter tracking dari URL sebelum Anda mengkliknya. Tanpa
pengumpulan data — semua berjalan lokal di browser Anda.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENGAPA LINK CLEANER?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setiap link yang Anda klik adalah peluang tracking. `utm_source=newsletter`,
`fbclid=IwAR...`, `gclid=...`, `igshid=...` — ini memberi tahu Google,
Facebook, dan 30+ platform lain dari mana Anda datang dan apa yang Anda
klik.

Link Cleaner menghapusnya secara diam-diam sebelum navigasi. Anda klik;
tracker melihat kunjungan langsung; tidak ada yang keluar dari browser Anda.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FITUR UTAMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PRIVACY-FIRST
• Menghapus 88 parameter tracking dari Google, Facebook, Instagram, TikTok,
  Twitter/X, LinkedIn, Microsoft, Mailchimp, HubSpot, Marketo, Pinterest,
  Klaviyo, Matomo, Outbrain, Bing, Yandex, Quora, Reddit, Snap + 30 lainnya
• Prefix matching menangkap varian di masa depan
• Tanpa pengumpulan data — tanpa analytics, tanpa telemetry, tanpa remote call
• Semua pemrosesan terjadi lokal di perangkat Anda
• Open source (MIT) — baca setiap baris kode

⚡ TANPA KONFIGURASI
• Install dan langsung jalan — bekerja otomatis di setiap situs
• Rewrite atribut href anchor — klik kanan "Copy link" juga mendapat URL bersih
• Menangani SPA dan konten dinamis via MutationObserver
• Intercept navigasi programmatic (window.open, location.assign)

🎯 KUSTOMISASI POWERFUL
• Wildcard allowlist: matikan cleaning untuk domain tertentu
• Per-rule parameter overrides (always strip / never strip / custom prefixes)
• Per-domain rule overrides — rule khusus per host
• Bulk URL cleaner — paste hingga 1000 URL sekaligus
• Export/import settings ke/dari JSON — sinkronisasi antar device

📊 DASHBOARD STATISTIK
• Counter live link yang bisa di-clean di setiap halaman
• Statistik sepanjang waktu: URL dibersihkan, param dihapus
• Chart batang 7 hari
• Reset stats kapan saja

🎨 UI POLISHED
• Dark-mode aware
• Keyboard shortcuts (Ctrl+Shift+L/T/C)
• Cross-browser: Chrome, Edge, Brave, Firefox 109+, Safari 15.4+
• Multi-bahasa: English + Indonesian

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IZIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• storage — simpan settings dan stats secara lokal
• activeTab — baca URL tab saat ini saat Anda klik icon popup
• <all_urls> — inject content script di setiap halaman

Kami TIDAK meminta: tabs, cookies, history, clipboardWrite, notifications,
webRequest, atau izin sensitif lainnya. Lihat PRIVACY.md untuk detail lengkap.

🌐 GitHub: https://github.com/afiqandico13/link-cleaner
```

---

## 🔧 Chrome Web Store dashboard fields

| Field | Value |
|---|---|
| **Name** | Link Cleaner — Strip Tracking Params |
| **Summary** (≤ 132 chars) | See "Short description" above |
| **Category** | Privacy & Security (primary), Productivity (secondary) |
| **Language** | English (primary), Indonesian |
| **Visibility** | Public |
| **Pricing** | Free |
| **Privacy policy URL** | https://github.com/afiqandico13/link-cleaner/blob/main/PRIVACY.md |
| **Homepage URL** | https://github.com/afiqandico13/link-cleaner |
| **Support URL** | https://github.com/afiqandico13/link-cleaner/issues |
| **Mature content** | No |
| **Single purpose** | Strip tracking parameters from URLs |
| **Uses remote code** | No |
| **Uses encryption** | No |
| **Reason for <all_urls>** | "Content script intercepts link clicks on every page to strip tracking parameters before navigation" |

### Privacy practices disclosure (Chrome specific)

```
☐ Does NOT collect user data
☐ Does NOT use remote servers
☐ Does NOT use analytics services
☐ Does NOT sell user data
☐ Does NOT use cookies for tracking
☐ Does NOT read browsing history
☐ Does NOT read form data

☑ Uses <all_urls> content script permission (required to intercept links)
☑ Stores settings locally (chrome.storage.local)
```

---

## 🦊 Firefox AMO dashboard fields

| Field | Value |
|---|---|
| **Name** | Link Cleaner — Strip Tracking Params |
| **Summary** | Privacy-first browser extension that strips 88 tracking parameters from URLs |
| **Category** | Privacy & Security |
| **License** | MIT |
| **Homepage** | https://github.com/afiqandico13/link-cleaner |
| **Support email** | afiqandico13@gmail.com |
| **Support URL** | https://github.com/afiqandico13/link-cleaner/issues |
| **Privacy policy URL** | https://github.com/afiqandico13/link-cleaner/blob/main/PRIVACY.md |

---

## 📦 Building the extension for submission

```bash
# Clean build (exclude dev-only files)
mkdir -p /tmp/link-cleaner-build
cp -r link-cleaner/{manifest.json,rules,src,icons,screenshots,LICENSE,PRIVACY.md} /tmp/link-cleaner-build/
cp link-cleaner/README.md /tmp/link-cleaner-build/README.md
cd /tmp/link-cleaner-build
# Remove any leftover dev files
rm -rf node_modules tests .github
# Create ZIP
zip -r ../link-cleaner-v1.2.0.zip .
```

Then upload the ZIP to:
- Chrome Web Store developer dashboard
- Firefox AMO submission form
- Edge Add-ons (uses same ZIP format as Chrome)

---

## ✅ Submission checklist

### Chrome Web Store

- [ ] Create Google developer account (pay $5 one-time)
- [ ] Upload ZIP file (link-cleaner-v1.2.0.zip)
- [ ] Upload store-banner-440x280.png as Small tile
- [ ] Upload store-banner-1400x560.png as Large tile
- [ ] (Optional) Upload store-marquee-1400x560.png as Marquee
- [ ] Upload 3+ screenshots (use `store-screenshot-*.png` files)
- [ ] Fill in listing text (use "Detailed description (English)" above)
- [ ] Add privacy policy URL
- [ ] Fill in privacy practices disclosure
- [ ] Save as draft → Review → Publish

### Firefox AMO

- [ ] Create Mozilla account (free)
- [ ] Submit new add-on → upload ZIP
- [ ] Fill in listing text (English + Indonesian)
- [ ] Add privacy policy URL
- [ ] Submit for review
- [ ] Wait for approval email (1-7 days)

### Edge Add-ons

- [ ] Create Microsoft Partner account
- [ ] Submit new extension → upload ZIP
- [ ] Same assets as Chrome (different dashboard layout)
- [ ] Submit for review

---

## 🔍 Post-submission monitoring

After launch, monitor:

| What | Where | Action |
|---|---|---|
| Reviews | Chrome Web Store dashboard | Reply within 7 days |
| Bug reports | GitHub Issues | Triage by priority |
| Stats | Dashboard analytics | Track installs, ratings |
| Updates | Re-submit on new release | Keep version increments |

### Update workflow

```bash
# Make changes → test → commit → push
npm test  # must pass

# Update version in:
#   - manifest.json
#   - package.json
#   - src/options.html (version display)
#   - CHANGELOG.md

# Bump version, commit, push
git commit -m "v1.3.0: ..."
git push

# Re-zip and re-submit to stores
```

---

## 📊 Final structure

```
link-cleaner/
├── manifest.json              ← Version 1.2.0
├── README.md                  ← GitHub README
├── CHANGELOG.md               ← Version history
├── PRIVACY.md                 ← Store privacy policy
├── STORE_LISTING.md           ← This file
├── LICENSE                    ← MIT
├── CONTRIBUTING.md            ← How to contribute
├── package.json
├── rules/
│   └── tracking-params.js
├── src/
│   ├── clean-url.js
│   ├── content.js
│   ├── background.js
│   ├── i18n.js
│   ├── popup.html/css/js
│   ├── options.html/css/js
│   └── ...
├── icons/                     ← 16/32/48/128 PNG
├── screenshots/               ← Store assets (PNG)
│   ├── store-banner-440x280.png
│   ├── store-banner-1400x560.png
│   ├── store-marquee-1400x560.png
│   ├── store-screenshot-popup.png
│   ├── store-screenshot-options.png
│   ├── store-screenshot-bulk.png
│   ├── real-screenshot-popup.png
│   └── real-screenshot-options.png
├── safari/                    ← Safari variant + build docs
└── tests/
    ├── test.js                ← 82 unit tests
    └── test-content.js        ← 20 integration tests
```

---

## 🚀 Ready to launch

The repository is submission-ready:
- ✅ Manifest V3 compliant
- ✅ Privacy policy (PRIVACY.md)
- ✅ All required store assets (PNGs)
- ✅ Listing text in English + Indonesian
- ✅ Support URL (GitHub Issues)
- ✅ Single purpose clearly stated
- ✅ Minimal permissions justified

**Next step**: pay $5 to Chrome developer console and submit. Firefox AMO is free.