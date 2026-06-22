# Safari Web Extension Build Notes

Safari supports Web Extensions with Manifest V3 since Safari 15.4 (macOS Monterey),
but with some differences from Chrome:

1. **No `service_worker`**: Safari MV3 uses `background.scripts` instead.
2. **`background.persistent: false`** is required.
3. **`web_accessible_resources`** syntax is slightly different.
4. **`declarative_net_request`** is supported but with a 30k rule limit.
5. Safari requires `safari_web_extension_convert_image_for_menus` for icon handling.

This file is a reference for what the Safari variant of `manifest.json` would
look like. It is NOT loaded directly — you need to run
`safari-web-extension-converter` (part of Xcode) to produce a working Safari
extension bundle. See "Build steps" below.

## Manifest Variant (for reference)

```json
{
  "manifest_version": 3,
  "name": "Link Cleaner",
  "version": "1.1.0",
  "description": "Privacy-first browser extension that strips tracking parameters from URLs before navigation.",
  "icons": {
    "48": "icons/icon-48.png",
    "96": "icons/icon-96.png",
    "128": "icons/icon-128.png"
  },
  "background": {
    "scripts": ["src/background.js"],
    "persistent": false
  },
  "action": {
    "default_popup": "src/popup.html",
    "default_title": "Link Cleaner",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  "options_ui": {
    "page": "src/options.html",
    "open_in_tab": true
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": [
      "rules/tracking-params.js",
      "src/clean-url.js",
      "src/content.js"
    ],
    "run_at": "document_start"
  }],
  "permissions": ["storage", "activeTab", "<all_urls>"]
}
```

## Build steps (macOS only)

1. **Install Xcode** (latest from App Store)

2. **Create Safari Web Extension target:**
   - Open Xcode → File → New → Project → macOS → App
   - When prompted, check "Include Safari Extension"
   - Name it `LinkCleaner` (or similar)

3. **Replace generated extension files** with this project's source:
   ```bash
   # In the Xcode-generated project folder:
   rm -rf Resources/*
   cp -r /path/to/link-cleaner/{manifest.json,rules,src,icons,package.json} Resources/
   ```

4. **Edit Info.plist** for the extension target:
   - Set `NSExtensionPointIdentifier` = `com.apple.Safari.web-extension`
   - Set `NSExtensionPrincipalClass` = `$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler`

5. **Set Safari-specific settings** in the extension's manifest:
   - Add `"safari_web_extension_convert_image_for_menus": true` if you want
     extension icon variants in Safari menu
   - Use `.png` icons at 48/96/128 (Safari scales them)

6. **Build & run:**
   - Xcode → Product → Run
   - Safari will prompt to enable the extension under Develop menu

## Cross-browser code compatibility

The good news: **all source files (`rules/`, `src/`, `tests/`) work
identically in Safari** as they do in Chrome and Firefox. Only the
`manifest.json` differs.

`window.chrome.*` works in Safari Web Extensions (it's aliased to
`safari.*`).

## Known differences (handle gracefully)

- **Service worker**: Replace with `background.scripts` array.
  Note: background scripts in Safari MV3 don't have full service-worker
  capabilities (no `chrome.runtime.onInstalled` event in the same way).
- **Badge**: `chrome.action.setBadgeText` works.
- **Storage**: `chrome.storage.local` works.
- **Host permissions**: `<all_urls>` works.

## Testing on Safari

If you don't have a Mac, you can:
- Use BrowserStack or SauceLabs (paid)
- Ask a Mac-using friend to install via `safari-web-extension-converter`
- Use Xcode's iOS Simulator (free with Xcode) for iOS Safari testing

## Status

⚠️ **Not actively built.** This directory contains documentation only.
The Chrome / Edge / Brave / Firefox variants are the primary targets.

To prioritize Safari support in a future release, the work involves:
1. Acquire Apple Developer account ($99/year for App Store distribution)
2. Set up Xcode project with Safari Web Extension target
3. Run through App Store review (typically 1-3 days)
4. Maintain separate Safari-specific tests
