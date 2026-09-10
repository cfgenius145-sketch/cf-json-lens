# Privacy Policy — CF JSON Lens

_Last updated: 2026-09-09. Applies to CF JSON Lens 1.0.0._

## Summary

**CF JSON Lens collects no user data, makes no network requests, stores only
your theme and display preferences locally via `chrome.storage`, and never
transmits page content.**

## What the extension does with the pages you visit

CF JSON Lens reads the body of pages you open in order to decide whether they
contain JSON, and if so it re-renders that JSON as a formatted, highlighted
tree. This happens entirely inside your browser.

The content of those pages is **never** sent anywhere. It is not uploaded, not
logged, not cached off-device, and not shared with the developer or any third
party. The extension has no server component.

## What is stored

Exactly one key, `v2.options`, in `chrome.storage.local`, containing your
display preferences:

| field | what it is |
|---|---|
| `theme` | the name of the selected editor theme, e.g. `monokai` |
| `addons` | display toggles, e.g. whether to prepend the URL/timestamp header, and the maximum document size to render |
| `structure` | your JSON-rendering structure settings |
| `style` | any custom CSS you have written on the options page |

`chrome.storage.local` is device-local. The extension does **not** use
`chrome.storage.sync`, so these preferences are never uploaded to a Google
account or synchronised between machines.

No browsing history, no URLs, no page content, and no personal information of
any kind is stored.

## Network activity

The extension makes **no network requests**. Verified against the built
bundles: there are zero occurrences of `fetch`, `XMLHttpRequest`,
`WebSocket`, `EventSource` or `navigator.sendBeacon` in any of the seven
scripts that ship.

There is no analytics, no telemetry, no crash reporting, no advertising, and no
phone-home of any kind.

Two clarifications, so this claim is not read as broader than it is:

- The built code contains the strings `http://www.w3.org/2000/svg` and
  `http://www.w3.org/1999/xlink`. These are **XML namespace identifiers** used
  to construct inline SVG icons. They are never fetched.
- The options page shows a version number that **links** to this repository.
  That is an ordinary hyperlink you may choose to click; the extension does not
  contact GitHub on its own.

All fonts, stylesheets, themes and scripts are bundled in the extension
package. Nothing is loaded from a CDN or any remote host.

## Permissions and why they are needed

| permission | why |
|---|---|
| `storage` | to save the display preferences listed above |
| `host_permissions: <all_urls>` | to read the body of a page you open so the extension can determine whether it is JSON and render it |

The host permission grants the ability to **read** the document already on
your screen. It is not used to transmit anything. A JSON document can be served
from any host, and the `Content-Type` header is not a reliable signal — many
APIs return JSON as `text/plain` and some as `text/html` — so the only
dependable test is to read the body the browser has already loaded and try to
parse it. On pages whose body does not parse as JSON, the extension takes no
action at all.

The extension requests no other permissions. It does not use `identity`,
`cookies`, `history`, `tabs`, `webRequest`, or any OAuth flow.

## Children

The extension collects no data from anyone, including children.

## Changes to this policy

Any change will be committed to this file in the repository, so the full
history is public and auditable.

## Contact

Questions, concerns or corrections: please open an issue at

**https://github.com/cfgenius145-sketch/cf-json-lens/issues**
