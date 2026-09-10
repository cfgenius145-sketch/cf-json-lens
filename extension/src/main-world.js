/*
 * Runs in the page's MAIN world.
 *
 * The original extension exposed the parsed payload as `window.json` by
 * appending an inline <script> to the document. Manifest V3 blocks inline
 * script execution under the page's content security policy, so the isolated
 * content script now dispatches the JSON text as a CustomEvent and this
 * listener — which shares the page's global scope — assigns it.
 *
 * Same observable behaviour: `window.json` in the console.
 */
document.addEventListener('cf-json-lens:expose', function(event) {
  try {
    window.json = JSON.parse(event.detail);
  } catch (e) {
    /* payload was not parseable; leave window.json untouched */
  }
}, false);
