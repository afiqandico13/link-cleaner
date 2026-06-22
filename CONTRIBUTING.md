# Contributing to Link Cleaner

Thanks for your interest in making web tracking a little less ubiquitous.
Link Cleaner is open-source and contributions of all sizes are welcome.

## Quick Links

- **Bug reports**: [GitHub Issues](https://github.com/afiqandico13/link-cleaner/issues)
- **Feature requests**: [GitHub Issues](https://github.com/afiqandico13/link-cleaner/issues) (label: enhancement)
- **Tracker to add**: see [Adding a tracking parameter](#adding-a-tracking-parameter)

## Development Setup

```bash
git clone https://github.com/afiqandico13/link-cleaner.git
cd link-cleaner
npm install            # installs jsdom for tests
npm test               # runs all 74 tests
```

## Load the extension in Chrome for manual testing

1. Open `chrome://extensions`
2. Toggle **Developer mode**
3. Click **Load unpacked**
4. Select the `link-cleaner/` directory
5. Reload the extension after any code change (or use "Update" button on
   the extensions page)

## Project Structure

```
link-cleaner/
├── manifest.json            Manifest V3 declaration
├── rules/
│   └── tracking-params.js   Database of tracked params + prefixes
├── src/
│   ├── clean-url.js         Pure URL cleaning (no DOM dependency)
│   ├── content.js           Content script (runs in every page)
│   ├── background.js        Service worker (stats, badge)
│   ├── popup.html/css/js    Popup UI
├── icons/                   PNG icons at 16/32/48/128
└── tests/
    ├── test.js              Unit tests + perf benchmark
    └── test-content.js      JSDOM integration tests
```

## Architecture Rules

1. **`clean-url.js` is pure** — no DOM, no chrome.* globals. Receives URL +
   allowlist, returns cleaned URL. This keeps it 100% unit-testable in Node.

2. **`tracking-params.js` exports globals** (`window.LinkCleaner.PARAMS`,
   `shouldStrip`). It's loaded BEFORE both `clean-url.js` (which uses
   `shouldStrip`) and any content script (which uses everything).

3. **`content.js` is browser-only** — uses `chrome.*` and DOM. Test it
   in JSDOM (see `test-content.js`).

4. **All params in DB are lowercase** — `shouldStrip()` lowercases keys before
   checking, so the DB stays clean.

## Adding a tracking parameter

This is the most common contribution. Two cases:

### Case 1: known exact-match param (e.g. `new_tracker_id`)

Edit `rules/tracking-params.js`:

```js
const PARAMS = new Set([
  // ... existing
  "new_tracker_id",  // <-- add here
]);
```

### Case 2: new prefix pattern (e.g. `xyz_*`)

```js
const PREFIXES = [
  // ... existing
  "xyz_",  // <-- add here
];
```

Then add a test in `tests/test.js`:

```js
console.log("\n=== New Tracker ===");
{
  const r = clean("https://example.com/?new_tracker_id=abc&id=1");
  assert("removes new_tracker_id", !r.cleaned.includes("new_tracker_id"));
  assert("preserves id=1", r.cleaned.includes("id=1"));
}
```

Run `npm test` to verify, then open a PR.

## Code Style

- Vanilla JS only — no build tools, no TypeScript, no transpilers
- ES2017+ syntax (Chrome/Firefox modern versions)
- `"use strict"` at top of every file
- Functions prefer early-return over nested conditionals
- Comments explain WHY, not WHAT
- No external dependencies for the extension itself (only `jsdom` for tests)

## Commit Messages

Use conventional commits:

```
feat: add Klaviyo tracking params
fix: handle undefined hostname in cleanUrl
docs: add Safari extension section to README
test: add coverage for window.open race condition
refactor: extract cleanUrl into standalone module
```

## Pull Request Process

1. Fork the repo and create a branch (`git checkout -b add-new-tracker`)
2. Add your changes (param, test, doc)
3. Run `npm test` — all 74 tests must pass
4. Run `npm run test:perf` if you touched `clean-url.js` — perf should stay
   above 50,000 ops/sec on the typical benchmark
5. Update `CHANGELOG.md` under the "Unreleased" section
6. Open a PR with a clear description and reference any related issues

## Reporting Bugs

When reporting a bug, please include:

- Browser + version (Chrome 120 / Firefox 130 / etc.)
- The URL pattern that failed (you can sanitize it)
- Expected vs actual behavior
- Console errors (if any) — open DevTools → Console → look for `[LinkCleaner]`

## Security

If you find a security issue in Link Cleaner itself (not a bug in tracking
detection), please report it privately to afiqandico13@gmail.com before
opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under
the project's MIT license.
