# CF JSON Lens

Pretty, fast JSON in your browser. Themes, collapsible tree, raw toggle.

CF JSON Lens formats and syntax-highlights JSON and JSONP responses as you
browse. It renders a collapsible tree, lets you flip back to the raw payload,
ships ~26 editor themes, and adds a `json-viewer` omnibox keyword with a
scratch pad for pasting JSON by hand.

## Credits

**Based on [json-viewer](https://github.com/tulios/json-viewer) by Túlio
Ornelas, MIT licensed.** The original was last released for Manifest V2 and no
longer builds or runs on current Chrome. CF JSON Lens is a maintained fork:
same behaviour, ported to Manifest V3 with a rebuilt toolchain.

The original copyright notice is retained in `LICENSE` alongside the new one.

## What changed from the original

- **Manifest V3.** Background event page → service worker, `browser_action`
  keys removed, host permissions moved to `host_permissions`,
  `web_accessible_resources` in object form.
- **Options moved to `chrome.storage.local`.** `localStorage` does not exist in
  a service worker. The `GET_OPTIONS` message handler is now asynchronous.
- **`chrome.extension.getURL` → `chrome.runtime.getURL`** (3 call sites).
- **Rebuilt toolchain.** webpack 1.15 + node-sass + extract-text-webpack-plugin
  → webpack 5 + dart-sass + mini-css-extract-plugin. The original dependency
  set was internally inconsistent (webpack 1 with sass-loader 6, which requires
  webpack 2–4) and did not install or build on any current Node.
- **New icon and name.** No original artwork is reused.

The legacy `restoreOldOptions()` migration was dropped: it read json-viewer's
own pre-v2 `localStorage` namespace, which cannot exist under a new extension
ID and is unreachable from a service worker.

## Build

Requires Node 20 or newer.

```sh
npm ci
npm run build
```

Output is written to `build/json_viewer/`, with `manifest.json` at its root.

To load it in Chrome: open `chrome://extensions`, enable **Developer mode**,
click **Load unpacked**, and select `build/json_viewer`.

## Local files

Chrome does not give extensions access to `file://` URLs by default. To use
CF JSON Lens on JSON files opened from disk, open `chrome://extensions`, click
**Details** on CF JSON Lens, and enable **Allow access to file URLs**.

## Privacy

CF JSON Lens collects no data, makes no network requests, and never transmits
page content. See [PRIVACY.md](PRIVACY.md).

## License

MIT. See `LICENSE`.
