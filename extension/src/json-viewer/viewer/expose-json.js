function exposeJson(text, outsideViewer) {
  console.info("[CF JSON Lens] Your json was stored into 'window.json', enjoy!");

  if (outsideViewer) {
    window.json = JSON.parse(text);

  } else {
    /*
     * Manifest V3 forbids injecting an inline <script>, so hand the payload to
     * the MAIN-world content script (src/main-world.js) instead. It shares the
     * page's globals and performs the assignment.
     */
    document.dispatchEvent(new CustomEvent('cf-json-lens:expose', {detail: text}));
  }
}

module.exports = exposeJson;
