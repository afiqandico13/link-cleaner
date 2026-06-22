# 🛡️ Link Cleaner

**Privacy-first browser extension that strips tracking parameters from URLs
before you navigate to them.** Zero data collection, works offline, free forever.

[![Manifest](https://img.shields.io/badge/manifest-V3-blue)]()
[![Chrome](https://img.shields.io/badge/Chrome-supported-success)]()
[![Firefox](https://img.shields.io/badge/Firefox-109%2B-success)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Tests](https://img.shields.io/badge/tests-38%20passed-success)]()

---

## Why?

Every link you click is a tracking opportunity. `utm_source=newsletter&utm_campaign=spring`,
`fbclid=IwAR...`, `gclid=...`, `igshid=...` — these tell Google, Facebook, and 30+
other platforms exactly where you came from and what you clicked.

Link Cleaner strips them **silently** before navigation. You click; the tracker
sees a direct visit; nothing leaves your browser.

---

## Features

- **88 tracking parameters** in the database — covers Google, Facebook, Instagram,
  Twitter/X, TikTok, LinkedIn, Microsoft, Mailchimp, HubSpot, Marketo, Pinterest,
  Klaviyo, Matomo, Outbrain, Bing, Yandex, Quora, Reddit, Snap, and generic
  patterns (`utm_*`, `_hs*`, `fb_*`, `__hs*`).
- **Prefix matching**: any param starting with `utm_`, `fb_`, `_hs`, `__hs` is also
  stripped (catches future variants without code changes).
- **Wildcard allowlist** — disable cleaning for specific domains:
  - `example.com` → exact match
  - `*.example.com` → any subdomain (not the apex)
  - `.example.com` → apex + all subdomains
- **Zero-config**: install, done. Works on every site automatically.
- **Page action badge** — toolbar icon shows count of cleanable links on the
  current page (`🛡️ 12`). Updates live as you scroll.
- **Popup preview**: see exactly which params got stripped from the current URL.
- **Copy / navigate**: copy the cleaned URL to clipboard, or one-click navigate
  to it.
- **Stats**: count of URLs cleaned + params removed (all-time).
- **Cross-browser**: Chrome / Edge / Brave (Chromium) and Firefox 109+.
- **Manifest V3**: future-proof, proper MV3 service worker.
- **No data collection**: see [Privacy](#privacy) below.
- **Dark-mode aware UI**: respects `prefers-color-scheme`.
- **Keyboard shortcut**: `Ctrl+Shift+L` (`Cmd+Shift+L` on Mac).

---

## Installation

### From source (developer mode)

**Chrome / Edge / Brave:**
1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `link-cleaner/` directory

**Firefox 109+:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `link-cleaner/manifest.json`

> Temporary add-ons in Firefox are removed on browser restart. For permanent
> install, package the extension (see Mozilla's docs) or use the Firefox
> Add-ons store.

### For development

```bash
git clone https://github.com/afiqandico13/link-cleaner.git
cd link-cleaner
npm install         # installs jsdom for tests
npm test            # runs all 74 tests (unit + integration + perf)
```

Load as unpacked (steps above). Reload after every code change.

---

## Usage

**Automatic:** install and forget. Every link click is intercepted.

**Manual:** click the extension icon → see what gets stripped → copy or navigate.

**Keyboard:** `Ctrl+Shift+L` (`Cmd+Shift+L` on Mac) opens the popup.

**Allowlist a domain:** type the hostname in the popup (e.g. `yourcompany.com`)
→ enter. That domain's URLs will be passed through untouched.

---

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│  User clicks <a href="...?utm_source=ig&id=42">          │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
        ┌───────────────────────────────┐
        │  Content script (src/content.js) │
        │  1. Listens for click events     │
        │  2. Calls LinkCleaner.cleanUrl() │
        │  3. URL params checked vs DB     │
        │  4. Tracking params stripped     │
        └─────────────┬─────────────────┘
                      │
                      ▼
        ┌───────────────────────────────┐
        │  window.location.href =        │
        │  ".../article?id=42"           │
        │  (no utm_source)                │
        └───────────────────────────────┘
```

The content script also rewrites anchor `href` attributes in the DOM, so
**right-click → Copy link** gives you the clean URL too. A MutationObserver
catches dynamically-added links (SPAs, lazy-loaded feeds, infinite scroll).

`window.open` and `location.assign/replace` are intercepted the same way.

---

## Tracking Parameter Database

Sources used to build the database (`rules/tracking-params.js`):

- **Official docs**: Google's [UTM spec](https://docs.utm.io/), Microsoft
  Advertising docs, etc.
- **Open-source lists**: [clean-url](https://github.com/lukaszgrolik/clean-url),
  [Disable-Tracking-Parameters](https://github.com/mpchadwick/Disable-Tracking-Parameters)
- **Vendor announcements** (LinkedIn lipi, TikTok _ttp, etc.)

**Coverage (88 parameters):**

| Platform | Count | Examples |
|---|---:|---|
| Google Analytics / Ads | 18 | `utm_source`, `gclid`, `gclsrc`, `_ga` |
| Facebook / Meta | 6 | `fbclid`, `fb_action_ids` |
| Instagram | 1 | `igshid` |
| Twitter / X | 1 | `twclid` |
| TikTok | 2 | `tt_medium`, `_ttp` |
| LinkedIn | 8 | `trk`, `lipi`, `lici`, `midtoken` |
| Microsoft / Bing | 2 | `msclkid`, `mscvid` |
| Mailchimp | 2 | `mc_cid`, `mc_eid` |
| HubSpot | 8 | `_hsenc`, `__hssc`, `_hsfp` |
| Marketo | 1 | `mkt_tok` |
| Pinterest | 1 | `epik` |
| Klaviyo | 1 | `_kx` |
| Matomo | 9 | `mtm_source`, `mtm_campaign`, … |
| Outbrain / Taboola | 3 | `obclid`, `obOrigUrl` |
| Yandex | 1 | `_openstat` |
| Quora | 1 | `qclid` |
| Reddit | 2 | `ref_source`, `ref_campaign` |
| Snap | 1 | `scid` |
| Generic | 19 | `ref`, `src`, `source`, `campaign_id` |

Plus prefix patterns: `utm_*`, `fb_*`, `_hs*`, `__hs*`.

### Adding a new tracker

Edit `rules/tracking-params.js`:

```js
const PARAMS = new Set([
  // ... existing
  "new_tracker_param",  // <-- add here
]);
```

Reload the extension in `chrome://extensions`. Done.

---

## Testing

```bash
npm install   # installs jsdom (one-time)
npm test      # runs all 74 tests (unit + integration + perf)
```

**54 unit tests** (`tests/test.js`) cover:
- Each major platform's params (Google, Facebook, Instagram, TikTok, …)
- Prefix matching (`utm_*`, etc.)
- Wildcard allowlist (`example.com`, `*.example.com`, `.example.com`)
- Idempotence (cleaning twice = cleaning once)
- Non-http(s) URLs (mailto:, tel:, javascript:)
- Relative URL resolution
- Edge cases (invalid URLs, empty strings, fragments)
- Performance benchmark (100,000+ cleanings in ~1s)

**20 integration tests** (`tests/test-content.js`) using JSDOM cover:
- Anchor href rewriting at boot
- MutationObserver picks up dynamically-added links
- Click interception (race-condition guard)
- `window.open` / `location.assign` interception
- Disabled mode (settings toggle off)
- Allowlist behavior
- SPA stress test (100 rapid-fire link additions)

---

## Project Structure

```
link-cleaner/
├── manifest.json              Manifest V3 declaration
├── README.md
├── LICENSE                    MIT
├── .gitignore
├── rules/
│   └── tracking-params.js     88 tracking params + prefix patterns
├── src/
│   ├── clean-url.js           Pure URL cleaning function (reusable)
│   ├── content.js             Content script: intercept clicks, rewrite DOM
│   ├── background.js          Service worker: stats, settings init
│   ├── popup.html             Extension popup UI
│   ├── popup.css              Popup styling (dark-mode aware)
│   └── popup.js               Popup logic
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── tests/
    └── test.js                38 unit tests for URL cleaning
```

---

## Privacy

**Link Cleaner collects zero data.** Specifically:

- ❌ No analytics, no telemetry, no remote calls
- ❌ No data sent to any server (yours or anyone else's)
- ✅ All processing happens locally in your browser
- ✅ Settings stored in `chrome.storage.local` (local device only)
- ✅ Source code is fully open — read it yourself

The extension needs the `<all_urls>` host permission because it intercepts
clicks on every page. This is the standard pattern for URL-cleaning extensions
(see [ClearURLs](https://github.com/ClearURLs/Addon), [Neat URL](https://github.com/Smile4Bliss/Neat_URL)).

The extension does **not** read your browsing history, form data, cookies, or
anything else. It only looks at URLs.

---

## Permissions Explained

| Permission | Why |
|---|---|
| `storage` | Save your settings (enabled toggle, allowlist) locally |
| `activeTab` | Read the current tab's URL when you click the popup icon |
| `<all_urls>` (host) | Run the content script on every page to intercept clicks |

That's it. No clipboard, no tabs, no cookies, no history, no notifications.

---

## Why a browser extension (not a script or proxy)?

| Approach | Pros | Cons |
|---|---|---|
| Browser extension (this) | Works system-wide, no setup per browser | Need to install |
| Tampermonkey userscript | Easy to share, version-control | Only works on browsers with TM |
| Local proxy (mitmproxy) | Powerful, applies to all apps | Heavy setup, breaks HTTPS certs |
| DNS-level (Pi-hole) | Network-wide coverage | URL-level params not in DNS queries |

A browser extension hits the sweet spot: zero-config, zero data leakage, runs
on every site, easy to inspect or fork.

---

## Roadmap

- [ ] Firefox AMO (addons.mozilla.org) submission
- [ ] Chrome Web Store submission
- [ ] Optional rules editor (let users add custom tracking domains)
- [ ] Selective history-aware cleaning (e.g., strip `gclid` only if older than 90 days)
- [ ] WebKit/Safari support

---

## Author

**Afiq Andico Pangimpian** — IT professional & security researcher, Bali.

- GitHub: [@afiqandico13](https://github.com/afiqandico13)
- Other privacy/security work: [pilgrims](https://github.com/afiqandico13/pilgrims) (web security scanner)

---

## License

MIT — see [LICENSE](LICENSE).

## Related projects

- [PILGRIMS](https://github.com/afiqandico13/pilgrims) — Web security scanner
  (companion project; PILGRIMS detects issues, Link Cleaner prevents the
  trackers that PILGRIMS detects)
- [tokokita](https://github.com/afiqandico13/tokokita) — Security-hardened
  e-commerce app

Built as a portfolio piece demonstrating browser extension development,
privacy tooling, and Manifest V3 best practices.
