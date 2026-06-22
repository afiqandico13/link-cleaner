# Privacy Policy — Link Cleaner

**Effective date:** 2026-06-22
**Last updated:** 2026-06-22
**Extension version:** 1.2.0+

Link Cleaner is a privacy-first browser extension. This policy explains exactly
what data we collect, store, and transmit. Spoiler: as close to nothing as
technically possible.

## Short version

**We collect zero data.** No analytics, no telemetry, no remote calls. All
processing happens locally in your browser. Your settings live in your
browser's local storage. No server ever sees your data.

## Detailed breakdown

### What we collect

**Nothing.** Specifically:

- ❌ No usage statistics
- ❌ No crash reports
- ❌ No error telemetry
- ❌ No "phone home" pings
- ❌ No fingerprinting
- ❌ No A/B testing
- ❌ No third-party analytics (no Google Analytics, Mixpanel, Sentry, etc.)

### What we store (locally on your device)

The extension stores the following in `chrome.storage.local`:

| Field | Purpose | Stored where |
|---|---|---|
| `enabled` | On/off toggle | Your device only |
| `allowlist` | Domains where cleaning is disabled | Your device only |
| `customStrip` | Extra params to always strip | Your device only |
| `customKeep` | Params to never strip | Your device only |
| `customPrefixes` | Custom prefix patterns | Your device only |
| `perDomainRules` | Per-domain rule overrides (v1.2+) | Your device only |
| `stats` | Aggregate counters (URLs/params cleaned, per-day) | Your device only |

You can wipe all stored data by:
1. Opening the Options page → clicking "Reset everything to defaults", or
2. Uninstalling the extension (Chrome/Firefox delete extension storage on uninstall)

### What we transmit

**Nothing.** The extension makes zero network requests. You can verify this:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "background page" or "service worker" for Link Cleaner
4. Open the Network tab
5. Use the extension — observe zero outbound requests

Or check the source code (it's all in this repository, MIT-licensed).

### Permissions we request (and why)

| Permission | Why we need it |
|---|---|
| `storage` | Save your settings and stats locally |
| `activeTab` | Read the current tab's URL when you click the popup icon |
| `<all_urls>` (host) | Inject the content script on every page so we can intercept link clicks |

We do NOT request: `tabs`, `cookies`, `history`, `clipboardWrite`, `notifications`, `webRequest`, `webRequestBlocking`, `proxy`, `vpnProvider`, `desktopCapture`, or any other sensitive permission.

### Third parties

**None.** The extension does not communicate with any third-party service,
analytics provider, advertising network, or remote server.

### Children's privacy

Link Cleaner does not knowingly collect any data from anyone, including
children under 13. Since we collect no data at all, this is trivially satisfied.

### Data retention

Since we collect no data, there is nothing to retain. Your settings are stored
on your device until you:
- Uninstall the extension (settings deleted with the extension)
- Click "Reset everything to defaults" in Options
- Manually clear extension storage via `chrome://settings/clearBrowserData`

### Changes to this policy

If we ever change this policy (e.g., to add optional opt-in analytics), we will:
1. Update this file with a new "Last updated" date
2. Add a prominent CHANGELOG entry
3. Show an in-extension notice on next launch
4. Require explicit user opt-in for any new data collection

We will NEVER silently start collecting data.

### Open source

This entire extension is open source under the MIT license. You can:
- Read every line of code: https://github.com/afiqandico13/link-cleaner
- Verify the claims in this policy by reading the source
- Fork it, modify it, build your own version with different behavior
- Report any discrepancy: https://github.com/afiqandico13/link-cleaner/issues

### Contact

If you have questions about this privacy policy:

- GitHub Issues: https://github.com/afiqandico13/link-cleaner/issues
- Email: afiqandico13@gmail.com

---

## Compliance

This extension is designed to comply with:

- **GDPR** (EU General Data Protection Regulation) — we collect no personal data, so most GDPR requirements are vacuously satisfied
- **CCPA** (California Consumer Privacy Act) — no data to access, delete, or sell
- **Chrome Web Store User Data Policy** — only the minimum permissions needed, no data leaves the device
- **Firefox Add-on Policies** — minimal permissions, transparent behavior

---

*This policy is itself open source. If you find it unclear, file an issue.*
