/**
 * Rewritten for webpack 5.
 *
 * Behaviour is unchanged from the original plugin; only the hook API differs
 * (`compiler.plugin('done', fn)` was removed in webpack 4).
 *
 * Steps, in order:
 *   1. copy extension/icons and extension/pages into the build root
 *   2. for each theme: drop the emitted <theme>.js, move <theme>.css to
 *      themes/<darkness>/<theme>.css
 *   3. read extension/manifest.json, append the theme CSS paths to
 *      web_accessible_resources, write it to the build root
 *
 * Step 3 is manifest-version aware: MV2 takes a flat array of paths, MV3 takes
 * an array of objects, so the theme paths are appended to the `resources` list
 * of the first MV3 entry instead.
 */
const fs = require('fs-extra');
const path = require('path');
const BuildPaths = require('../build-paths');

function relocateThemes(darkness, list) {
  const paths = [];

  list.forEach((theme) => {
    const themeCSSPath = `themes/${darkness}/${theme}.css`;
    const emitted = path.join(BuildPaths.EXTENSION, 'assets', theme);

    if (fs.existsSync(`${emitted}.css`)) {
      fs.removeSync(`${emitted}.js`);
      fs.moveSync(`${emitted}.css`, path.join(BuildPaths.EXTENSION, themeCSSPath), {
        overwrite: true,
      });
      paths.push(themeCSSPath);
    } else {
      console.error(`  fail to relocate: ${emitted}.css`);
    }
  });

  return paths;
}

class BuildExtension {
  constructor(options) {
    this.themes = (options && options.themes) || { light: [], dark: [] };
  }

  apply(compiler) {
    compiler.hooks.done.tap('BuildExtension', () => {
      console.log('\n-> copying icons and pages');
      fs.copySync(
        path.join(BuildPaths.SRC_ROOT, 'icons'),
        path.join(BuildPaths.EXTENSION, 'icons')
      );
      fs.copySync(
        path.join(BuildPaths.SRC_ROOT, 'pages'),
        path.join(BuildPaths.EXTENSION, 'pages')
      );

      console.log('-> relocating themes');
      const available = this.themes;
      const themeCSSPaths = relocateThemes('light', available.light).concat(
        relocateThemes('dark', available.dark)
      );
      console.log(`   ${themeCSSPaths.length} theme stylesheets`);

      const manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));

      if (manifest.manifest_version >= 3) {
        // MV3: web_accessible_resources is a list of {resources, matches}.
        manifest.web_accessible_resources = manifest.web_accessible_resources || [];
        if (manifest.web_accessible_resources.length === 0) {
          manifest.web_accessible_resources.push({ resources: [], matches: ['<all_urls>'] });
        }
        const first = manifest.web_accessible_resources[0];
        first.resources = (first.resources || []).concat(themeCSSPaths);
      } else {
        // MV2: flat array of paths.
        manifest.web_accessible_resources = (manifest.web_accessible_resources || []).concat(
          themeCSSPaths
        );
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('-> dev build: suffixing name');
        manifest.name += ' - dev';
      }

      console.log('-> writing manifest.json');
      fs.outputJSONSync(path.join(BuildPaths.EXTENSION, 'manifest.json'), manifest, { spaces: 2 });
    });
  }
}

module.exports = BuildExtension;
