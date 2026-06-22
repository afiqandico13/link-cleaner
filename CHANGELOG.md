# Changelog

All notable changes to Link Cleaner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-22

### Added
- **i18n module** (`src/i18n.js`) — English + Indonesian (auto-detect via `navigator.language`).
  Use `window.LinkCleaner.i18n.t(key, ...args)` for `%s`/`%d` substitutions.
- **Statistics dashboard with 7-day bar chart** in Options → General.
  Tracks per-day URL/param counts, renders pure-SVG chart (no charting lib).
- **Per-domain rule overrides** (Options → Per-domain tab).
  Domain-specific `strip`/`keep`/`prefixes` rules that REPLACE global rules
  for matching hosts (with wildcard support: `*.example.com`).
- **Toolbar icon variant for allowlisted pages** — badge shows `✓` (gray) when
  on a domain where cleaning is disabled, instead of the cleanable count.
- **New keyboard shortcuts**:
  - `Ctrl+Shift+T` (Mac: `Cmd+Shift+T`) — toggle cleaning on/off
  - `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`) — open popup with cleaned-URL action
- **`PRIVACY.md`** — comprehensive privacy policy (GDPR/CCPA compliant).
- **`STORE_LISTING.md`** — Chrome Web Store + Firefox AMO submission guide
  (icons, screenshots, listing text, privacy disclosure checklist).
- **Demo SVG mockups** in `screenshots/`:
  - `demo.svg` — banner showing extension in action
  - `popup.svg` — popup UI mockup
  - `options.svg` — options page mockup

### Changed
- `clean-url.js` accepts per-call `customRules` + `perDomainRules` (5th arg).
  Internal save/restore of global DB state to prevent leakage between calls.
- `content.js` reads `perDomainRules` from storage and passes to cleanUrl.
- `popup.js` reads `perDomainRules` for current-tab preview.
- `background.js` tracks `stats.daily[YYYY-MM-DD] = {urls, params}` (pruned
  to last 30 days).
- `options.js` adds Per-domain tab UI with auto-save (debounced 400ms).
- `manifest.json` adds `toggle-cleaning` + `clean-current-tab` commands.

### Tests
- **82 unit tests** (`tests/test.js`) — up from 63:
  - 19 new tests for per-domain rules (override, keep, wildcard, precedence)
  - 5 new tests for `matchesHostPattern` (exact, wildcard, suffix, case)
  - 5 new tests for i18n module
- **20 integration tests** (`tests/test-content.js`) — unchanged

### Total: 102 tests, 0 failures

---

## [1.1.0] - 2026-06-22

### Added
- **Per-rule parameter overrides** — three new rule types:
  - **Always strip**: extra params (in addition to the 88 in the database)
  - **Never strip**: protected params (override database, e.g., protect your own `ref` param)
  - **Custom prefixes**: any param starting with your prefix is stripped (e.g., `myapp_*`)
  - Precedence: customKeep > built-in prefixes > customPrefixes > customStrip > built-in DB
- **Options page** (`src/options.html/css/js`) — full-page settings UI with tabs:
  - **General**: toggle, stats display, reset everything
  - **Custom Rules**: text areas for strip/keep/prefixes + **live preview**
  - **Allowlist**: domain editor with pattern-type badges (exact / wildcard / suffix)
  - **Bulk Cleaner**: paste up to 1000 URLs, get cleaned versions, copy/download as .txt
  - **Backup**: export to JSON / import from JSON (with format validation)
  - **About**: version info, project links, how-it-works
- **Export/import** settings to/from JSON file — cross-device sync made easy
- **Bulk URL cleaner** — paste a list of URLs, get all cleaned at once
- **Live preview** in custom rules — type a URL, see what gets stripped instantly
- **Popup → Options link** — "Open full settings" button in popup footer
- **Safari Web Extension manifest variant** (`safari/manifest.json`) — reference
  implementation for Safari 15.4+ (requires Xcode build process; not actively shipped)

### Changed
- `rules/tracking-params.js` now also exports `customStrip`, `customKeep`,
  `customPrefixes` Sets + `setCustomRules()` helper
- `clean-url.js` unchanged signature — rules injected via setCustomRules()
- `content.js` listens for `customStrip`/`customKeep`/`customPrefixes` storage
  changes (live propagation to all tabs)
- `manifest.json` version → 1.1.0, adds `options_ui` field

### Tests
- **63 unit tests** (`tests/test.js`) — up from 54:
  - 9 new tests for custom rules (always-strip, never-strip, prefixes, precedence)
- **20 integration tests** (`tests/test-content.js`) — unchanged

### Total: 83 tests, 0 failures

---

## [1.0.0] - 2026-06-22

### Added
- **88 tracking parameters** in detection database covering Google, Facebook,
  Instagram, Twitter/X, TikTok, LinkedIn, Microsoft, Mailchimp, HubSpot, Marketo,
  Pinterest, Klaviyo, Matomo, Outbrain, Bing, Yandex, Quora, Reddit, Snap, and
  generic patterns (`utm_*`, `_hs*`, `fb_*`, `__hs*`).
- **Prefix matching**: any parameter starting with `utm_`, `fb_`, `_hs`, `__hs` is
  also stripped (catches future variants).
- **Wildcard allowlist**: three pattern forms supported:
  - `example.com` — exact hostname match
  - `*.example.com` — match any subdomain of example.com (not the apex)
  - `.example.com` — match example.com AND all subdomains
- **Content script** (`src/content.js`):
  - Anchor href rewriting on boot — right-click "Copy link" gives clean URL
  - MutationObserver — handles SPAs and dynamically-added links
  - Click interception as race-condition guard
  - `window.open` interception
  - `location.assign` / `location.replace` interception (with graceful degradation
    in environments where Location is read-only)
  - Live settings sync via `chrome.storage.onChanged`
- **Page action badge**: toolbar icon shows count of cleanable links on the page
  (e.g. `🛡️ 12`). Updates throttled to every 5 cleanings.
- **Popup UI** (`src/popup.html/css/js`):
  - Dark-mode aware (respects `prefers-color-scheme`)
  - Current-tab URL preview with diff view (original vs cleaned + removed pills)
  - Copy cleaned URL to clipboard
  - Open cleaned URL in current tab
  - Stats display (all-time URLs cleaned + params removed)
  - Allowlist editor
  - Reset stats button
  - View full tracking-params list (collapsible)
- **Background service worker** (`src/background.js`):
  - Stats aggregation across all tabs
  - Page action badge updates
  - Default settings on install
- **Manifest V3** with cross-browser support:
  - Chrome / Edge / Brave (Chromium)
  - Firefox 109+ (via `browser_specific_settings.gecko`)
- **Zero data collection**: no analytics, no remote calls, all processing local
- **Keyboard shortcut**: `Ctrl+Shift+L` / `Cmd+Shift+L` opens popup

### Tests
- **54 unit tests** (`tests/test.js`):
  - Per-platform coverage (Google, Facebook, Instagram, TikTok, LinkedIn,
    Mailchimp, HubSpot, etc.)
  - Prefix matching
  - Multi-tracker URLs
  - Idempotence
  - Wildcard allowlist (3 forms × 3 match scenarios)
  - Non-http URLs (mailto:, tel:, javascript:)
  - Relative URLs
  - Edge cases (null, undefined, invalid)
  - Case insensitivity
  - `stripAllParams` nuclear option
  - **Performance benchmark**: 10,000 cleanings in ~100ms (~100k ops/sec, ~10μs/op)
  - 100-parameter URL stress test (3000+ ops/sec)
- **20 integration tests** (`tests/test-content.js`) using JSDOM:
  - Anchor rewriting at boot
  - MutationObserver picks up new links
  - Click interception
  - window.open interception
  - location.assign interception
  - Disabled mode (settings toggle off)
  - Allowlist behavior
  - Non-http URLs skipped
  - SPA stress test (100 rapid-fire links)

### Total: 74 tests, 0 failures

---

## Versioning

- **Major**: breaking changes (rare — backward compat preferred)
- **Minor**: new features, new tracking params, new options
- **Patch**: bug fixes, performance improvements

## Roadmap

- [ ] Firefox Add-ons store submission
- [ ] Chrome Web Store submission
- [ ] Wildcard support per-rule (currently allowlist only)
- [ ] Domain-specific allowlist (use whitelist for some, default for others)
- [ ] Safari Web Extension support
- [ ] Bulk URL cleaner (paste a list of URLs → get cleaned versions)
- [ ] Optional analytics opt-in (default OFF — privacy-first)
