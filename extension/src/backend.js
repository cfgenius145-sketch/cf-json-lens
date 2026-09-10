var chrome = require('chrome-framework');
var Storage = require('./json-viewer/storage');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action !== "GET_OPTIONS") return;

  // Storage is asynchronous under Manifest V3, so the listener must return true
  // to keep the message channel open until sendResponse is called.
  Storage.load().then(function(value) {
    sendResponse({err: null, value: value});
  }).catch(function(e) {
    console.error('[CF JSON Lens] error: ' + e.message, e);
    sendResponse({err: {message: e.message}});
  });

  return true;
});
