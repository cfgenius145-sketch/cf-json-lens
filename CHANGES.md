# CF JSON Lens 1.0.0 — build report

Manifest V3 port of [json-viewer](https://github.com/tulios/json-viewer) by
Túlio Ornelas (MIT), rebranded as CF JSON Lens and rebuilt on a modern
toolchain.

**Package:** `dist/cf-json-lens-1.0.0.zip`
**sha256:** `6aeb1282bde9ccacbd33d0bb96531cbfc94e2671d5741f5b48dd16740b42ca96`
**Size:** 330,455 bytes, 54 entries, `manifest.json` at the zip root.

**Tests: 11/11 passing, zero console errors** — run against the build directory
and again against the unzipped package.

`json-viewer/` was never modified: verified byte-identical across all 191 files
at both ends of the work.

---

## 1. What changed vs the original

### Toolchain

The original could not be built. `package.json` declared **webpack 1.15.x**
(2016) alongside **sass-loader 6.x**, which requires webpack 2–4 — an internally
inconsistent set. Installs failed on Node 20 (node-sass/node-gyp), Node 14
(`ReferenceError: primordials is not defined`), and on Node 10 webpack started
but every theme module errored.

| original | now |
|---|---|
| webpack 1.15 | webpack 5.110 |
| node-sass 4 | sass (dart-sass) 1.83 |
| extract-text-webpack-plugin 0.8 | mini-css-extract-plugin 2.9 |
| css-loader 0.14 / style-loader 0.18 / sass-loader 6 | css-loader 7 / sass-loader 16 |
| clean-webpack-plugin 0.1 | `output.clean` |
| node-libs-browser, archiver | dropped (unused / no longer needed) |

`npm ci && npm run build` now completes in ~2.5s with **0 errors and 0 warnings**
(169 packages installed in 7s, versus 560 on Node 14 or an outright failure on
Node 20).

The emitted layout is deliberately identical to the original, because the
manifest references those exact paths. The custom `BuildExtension` plugin was
ported from `compiler.plugin('done')` (removed in webpack 4) to
`compiler.hooks.done.tap`, and made manifest-version aware so it appends theme
stylesheets to `web_accessible_resources` in either MV2 array form or MV3 object
form.

### Manifest

```diff
-  "manifest_version": 2,
+  "manifest_version": 3,
-  "background": { "scripts": ["assets/backend.js","assets/omnibox.js"], "persistent": false },
+  "background": { "service_worker": "assets/service-worker.js" },
-  "permissions": ["*://*/*", "<all_urls>"],
+  "permissions": ["storage"],
+  "host_permissions": ["<all_urls>"],
-  "web_accessible_resources": ["assets/viewer.css", ...],
+  "web_accessible_resources": [{ "resources": [...30...], "matches": ["<all_urls>"] }],
-  "options_page": "pages/options.html",
+  "options_ui": { "page": "pages/options.html", "open_in_tab": true },
-  "omnibox": { "keyword": "json-viewer" },
+  "omnibox": { "keyword": "json" },
-  "offline_enabled": true,
+  "content_scripts": [ ...ISOLATED viewer..., ...MAIN main-world... ],
```

`*://*/*` and `<all_urls>` were listed under `permissions` in MV2; these are
**host** permissions and move to `host_permissions` in MV3. The only true API
permission is `storage`, newly required because options moved off `localStorage`.

**No `author` key.** MV3 requires `author` to be an object (`{"email": …}`) and
rejects a plain string — this silently prevented the extension from loading
until it was found. Shipping without it; the store takes the publisher from the
developer account.

### Storage

`localStorage` does not exist in a service worker, so options moved to
`chrome.storage.local` and every accessor is now promise-based. The stored shape
is unchanged (`addons` and `structure` remain JSON strings, which is what the
CodeMirror editors produce); a new `parseMaybe` helper tolerates either a string
or an already-parsed object so a malformed value degrades to defaults instead of
throwing.

`backend.js` now returns `true` from the `onMessage` listener to hold the
message channel open until `sendResponse` fires. Verified this survived
minification — the bundle ends the handler with `…,!0})`, the comma operator
returning `true`.

`get-options.js` needed **no change**: it already wrapped
`chrome.runtime.sendMessage` in a promise, so the content-script render path was
async before the port. `viewer.js` sets `pre.hidden = true` before rendering, so
the theme still applies before first paint.

The legacy `restoreOldOptions()` migration was dropped by agreement: it read
json-viewer's own pre-v2 `localStorage` namespace, which cannot exist under a new
extension ID and is unreachable from a service worker.

### getURL

`chrome.extension.getURL` → `chrome.runtime.getURL` at three call sites:
`omnibox.js:19`, `viewer/render-extras.js:16`, `load-css.js:6`.

### A defect static analysis missed

The first test run was 8/10, failing both JSON pages:

```
Executing inline script violates the following Content Security Policy directive
'script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' ...'
```

`viewer/expose-json.js` implemented the "your JSON is in `window.json`" feature
by appending an inline `<script>` to the document. MV3 blocks inline script
execution under the page CSP. The viewer still rendered, so **only the
`window.json` convenience was broken — this would have shipped unnoticed
without a runtime test.** The intake report did not list it, because grepping
for `eval` / `new Function` does not match `script.innerHTML`.

Ported rather than dropped: the isolated content script dispatches the payload
as a `CustomEvent`, and a new MAIN-world content script (`src/main-world.js`,
18 lines) performs the assignment in the page's global scope. Same observable
behaviour, no inline script, now covered by an explicit assertion.

### Branding

New `{ }` icon in `#1f5fbf` on white at 16/32/48/128. Pixels were verified, not
just filenames — which caught that Chrome silently rendered the 16px and 48px
screenshots as **pure white** (it will not render below a minimum window size);
those were regenerated by downscaling the verified 128px render.

The original json-viewer logo was also embedded as a base64 PNG inside
`styles/options-custom.scss`. It is replaced, and its bytes no longer appear
anywhere in the tree.

`LICENSE` retains `Copyright (c) 2017 Túlio Ornelas` and the full MIT text, with
`Copyright (c) 2026 CF Soft` added. The README credits the original project.

---

## 2. Build instructions

Requires Node 20+.

```sh
cd cf-json-lens
npm ci
npm run build          # -> build/json_viewer/
```

Load unpacked: `chrome://extensions` → Developer mode → Load unpacked →
`build/json_viewer`.

---

## 3. Test results

11/11, zero console errors, against both the build directory and the unzipped
package. Full detail in `reports/mv3-test.md`.

| fixture | Content-Type | result |
|---|---|---|
| `/data.json` | `application/json` | viewer renders, `window.json` set, no errors |
| `/plain.txt` | `text/plain` (JSON body) | viewer renders, no errors |
| `/page.html` | `text/html` | DOM untouched, no viewer injected, no errors |
| options page | — | renders, no errors, no old-brand link |

**Extensions cannot be tested headless on this machine.** Local Chrome is
148.0.7778.217 and Chrome disabled the `--load-extension` switch by default from
137 onward; separately, Playwright's `headless: true` uses
`chromium-headless-shell`, which has no extension support. This was isolated with
a 6-line throwaway MV3 extension that failed identically under both, proving the
harness rather than CF JSON Lens was at fault. The suite runs headed on
Playwright's bundled Chromium.

---

## 4. Chrome Web Store listing copy

### Title

```
CF JSON Lens
```

### Short description (71 / 132 characters)

```
Pretty, fast JSON in your browser. Themes, collapsible tree, raw toggle.
```

### Full description (152 words)

```
CF JSON Lens formats and syntax-highlights JSON and JSONP as you browse.

Open any API endpoint or .json file and the raw wall of text becomes a
readable, collapsible tree. Fold and unfold nodes, flip back to the raw
payload with one click, and pick from more than twenty editor themes in
light and dark. Your parsed document is also available as window.json in
the developer console, so you can poke at it without copying anything out.

Type "json" in the address bar for a scratch pad where you can paste and
format JSON by hand.

Everything runs locally in your browser. CF JSON Lens makes no network
requests, collects no data, and sends nothing anywhere.

CF JSON Lens is a maintained fork of the json-viewer extension by Túlio
Ornelas, which was built for Manifest V2 and no longer runs on current
Chrome. Same behaviour, rebuilt for Manifest V3. MIT licensed.
```

### Single-purpose statement

```
CF JSON Lens has a single purpose: to format and syntax-highlight JSON
documents that the user opens in their browser, and to provide the options
page that configures how that formatting looks.
```

### Justification for `<all_urls>` host permission and `document_start`

```
CF JSON Lens must inspect response bodies to detect JSON and render before
first paint.

A JSON document can be served from any host, and the server's Content-Type
header is not a reliable signal: many APIs return JSON as text/plain, and
some return it as text/html. The only dependable way to know whether a page
is JSON is to read the response body the browser has already loaded and
attempt to parse it. That requires a content script with host access to any
URL the user chooses to open. The extension inspects only pages the user
navigates to, and it takes no action at all on pages whose body does not
parse as JSON.

The content script runs at document_start because the raw payload must be
hidden and replaced before the browser paints it. Running any later produces
a visible flash of unstyled JSON before the formatted tree appears. Running
at document_start lets the extension hide the original <pre> element, fetch
the user's theme, and render the highlighted tree as a single uninterrupted
step.

No data leaves the browser. The extension makes no network requests of any
kind; the host permission is used solely to read and re-render the document
already on screen.
```
