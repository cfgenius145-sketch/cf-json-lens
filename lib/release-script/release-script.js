/**
 * Post-build cleanup.
 *
 * The original also zipped with `archiver` into pkg/<version>/. Packaging now
 * happens as an explicit step (see reports/CFJSONLENS.md), so this script only
 * removes build artefacts that must not ship:
 *
 *   - assets/viewer-alert.js : the viewer-alert entry is SCSS only; webpack
 *     still emits a stub .js for it, which nothing loads.
 *   - assets/<theme>.js      : each theme entry exists only to pull in its SCSS.
 *     BuildExtension already removes these, so this is a belt-and-braces sweep.
 */
const fs = require('fs-extra');
const path = require('path');
const BuildPaths = require('../build-paths');

const assetsDir = path.join(BuildPaths.EXTENSION, 'assets');

const KEEP_JS = new Set([
  'viewer.js',
  'options.js',
  'backend.js',
  'omnibox.js',
  'omnibox-page.js',
  'service-worker.js',
  'main-world.js',
]);

console.log('-> cleanup');

if (!fs.existsSync(assetsDir)) {
  console.error(`   assets directory missing: ${assetsDir}`);
  process.exit(1);
}

let removed = 0;
for (const filename of fs.readdirSync(assetsDir)) {
  if (filename.endsWith('.js') && !KEEP_JS.has(filename)) {
    fs.removeSync(path.join(assetsDir, filename));
    console.log(`   removed: assets/${filename}`);
    removed += 1;
  }
}

const themeCount =
  fs.readdirSync(path.join(BuildPaths.EXTENSION, 'themes/light')).length +
  fs.readdirSync(path.join(BuildPaths.EXTENSION, 'themes/dark')).length;

const manifest = fs.readJSONSync(path.join(BuildPaths.EXTENSION, 'manifest.json'));

console.log(`-> ${themeCount} theme stylesheets`);
console.log(`-> removed ${removed} stub script(s)`);
console.log(`-> manifest_version ${manifest.manifest_version}, version ${manifest.version}`);
console.log('-> done');
