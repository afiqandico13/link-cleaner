# Chrome Web Store / Firefox AMO Submission Guide

This document collects everything needed to publish Link Cleaner to the
Chrome Web Store and Firefox Add-ons (AMO). It is a checklist + asset
specification — actual submission is done via the web dashboard.

## Store listings

### Chrome Web Store Developer Dashboard
- URL: https://chrome.google.com/webstore/devconsole/
- One-time fee: **$5 USD** (pay once, lifetime)
- Review time: typically 1-3 business days
- Account required: Google account + Google Payments

### Firefox Add-ons (AMO)
- URL: https://addons.mozilla.org/developers/
- Fee: **FREE**
- Review time: typically 1-7 days
- Account required: Mozilla account

## Required assets

### Icons (already in repo)
- `icons/icon-128.png` (128×128) — primary, required by Chrome
- `icons/icon-48.png` (48×48) — required by Chrome
- `icons/icon-16.png` (16×16) — for browser UI
- `icons/icon-32.png` (32×48) — for Firefox

Chrome Web Store also accepts the same icons. For high-res displays, consider
generating `icon-256.png` and `icon-512.png` from the SVG source.

### Promotional images (Chrome Web Store)

Chrome requires:
- **Small tile**: 440×280 PNG or JPEG
- **Large tile** (optional): 1400×560 PNG or JPEG
- **Marquee** (optional, for featured placement): 1400×560 PNG

These are NOT in this repo yet — they need to be designed. Recommendations:
- Show the extension icon (shield) prominently
- Show the popup UI with an example URL being cleaned
- Use the brand purple (#6d28d9) as accent color
- Keep text minimal — 5-7 words max

### Screenshots (both stores)

Required sizes:
- Chrome: 1280×800 or 640×400 (up to 5 images)
- Firefox: 1280×800 (at least 1 image)

Recommended screenshot content:
1. **Popup** showing original → cleaned URL diff
2. **Options page** showing tabs
3. **Custom rules editor** with live preview
4. **Bulk cleaner** in action
5. **Toolbar badge** showing cleanable link count

These need to be created (suggested tool: Playwright + headless Chrome).

### Video (optional but recommended)

Chrome Web Store supports a YouTube video link for the listing.
- 30-90 seconds
- Show: install → click link → URL cleaned
- Can be created with: OBS, Loom, ScreenPal, etc.

## Store listing text

### Name
```
Link Cleaner — Strip Tracking Params
```
(Max 75 characters. Current: 44)

### Short description (Chrome: ≤ 132 chars)
```
Privacy-first browser extension that strips 88 tracking parameters (utm, fbclid,
gclid, etc.) from URLs. Zero data collection. Works offline.
```
(132 chars exact)

### Detailed description (Chrome: ≤ 16,384 chars)
See `STORE_DESCRIPTION.md` (separate file with the full text).

### Category
- Chrome: **Privacy & Security** (primary), **Productivity** (secondary)
- Firefox: **Privacy & Security**

### Language
- Primary: English
- (Optional: Indonesian, Spanish, etc.)

### Privacy policy URL
- `https://github.com/afiqandico13/link-cleaner/blob/main/PRIVACY.md`

### Homepage URL
- `https://github.com/afiqandico13/link-cleaner`

### Support URL
- `https://github.com/afiqandico13/link-cleaner/issues`

## Manifest requirements (Chrome)

For Chrome Web Store submission:

1. **`manifest_version: 3`** — ✓ (already done)
2. **Required fields:**
   - `name`, `version`, `description` — ✓
   - `icons` (128 required) — ✓
   - `permissions` and `host_permissions` justified in description — ✓
3. **Single purpose** — extension must do one thing clearly
   - Link Cleaner's purpose: "strip tracking parameters from URLs"
   - Documented in description — ✓
4. **No remote code execution** — ✓ (no eval, no remote scripts)
5. **Privacy practices disclosure** — fill out in dashboard:
   - Does NOT collect user data
   - Does NOT use remote servers
   - Only uses `<all_urls>` for content script injection

## Manifest requirements (Firefox)

Firefox AMO accepts the same `manifest.json` with minor differences:
- Includes `browser_specific_settings.gecko` for Firefox ID — ✓ (in repo)
- Manifest V3 requires Firefox 109+ — documented

## Submission checklist

- [ ] Create Chrome developer account ($5 paid)
- [ ] Create Mozilla account (free)
- [ ] Generate 1280×800 screenshots (5 images recommended)
- [ ] Generate 440×280 small tile
- [ ] (Optional) Generate 1400×560 marquee/large tile
- [ ] (Optional) Record 30-90 second demo video, upload to YouTube
- [ ] Zip the extension folder (exclude node_modules, .git, tests, package*.json)
- [ ] Upload to Chrome Web Store dashboard
- [ ] Upload to Firefox AMO
- [ ] Fill privacy disclosure forms (both stores)
- [ ] Wait for review
- [ ] Publish!

## Building the extension for submission

```bash
# Clean build (exclude dev-only files)
mkdir link-cleaner-build
cp -r link-cleaner/{manifest.json,rules,src,icons,LICENSE,PRIVACY.md} link-cleaner-build/
# Optional: keep README but rename to README.md if needed
cd link-cleaner-build
zip -r ../link-cleaner.zip .
```

Or use the Chrome Web Store's own "Developer mode → Pack extension" button.

## Post-launch

Once published:
- Add the store URL to README badges
- Update CHANGELOG with publication date
- Monitor reviews and respond to issues
- Submit updates as you release new versions

## Status

⚠️ **Not yet submitted.** This document is a checklist for future submission.
Submitting requires:
- Generated screenshots / promo images (currently no GUI capture tooling in this project)
- Manual web form submission (out of scope for automated CLI work)
- $5 Chrome fee (decisions/payments are user-driven)
