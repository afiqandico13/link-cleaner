# Changelog

All notable changes to Link Cleaner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
