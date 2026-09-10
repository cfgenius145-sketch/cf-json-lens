var defaults = require('./options/defaults');
var merge = require('./merge');
var chrome = require('chrome-framework');

var NAMESPACE = "v2.options";

/*
 * Options used to live in localStorage, which does not exist in a Manifest V3
 * service worker, so they now live in chrome.storage.local and every accessor
 * is asynchronous.
 *
 * The stored shape is unchanged: `addons` and `structure` are held as JSON
 * strings because that is what the CodeMirror editors on the options page
 * produce. parseMaybe tolerates either a string or an already-parsed object so
 * a malformed value degrades to the default instead of throwing.
 *
 * The original restoreOldOptions() migration was removed: it read json-viewer's
 * own pre-v2 localStorage namespace, which cannot exist under a new extension
 * ID and is unreachable from a service worker.
 */

function parseMaybe(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function normalize(stored) {
  var options = stored || {};

  options.theme = options.theme || defaults.theme;
  options.addons = merge({}, defaults.addons, parseMaybe(options.addons, {}));
  options.structure = parseMaybe(options.structure, defaults.structure);
  options.style = options.style && options.style.length > 0 ? options.style : defaults.style;

  return options;
}

module.exports = {
  save: function(obj) {
    return new Promise(function(resolve, reject) {
      var payload = {};
      payload[NAMESPACE] = obj;

      chrome.storage.local.set(payload, function() {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },

  load: function() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(NAMESPACE, function(result) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(normalize(result ? result[NAMESPACE] : null));
        }
      });
    });
  }
};
