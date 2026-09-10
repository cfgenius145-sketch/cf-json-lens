/**
 * CF JSON Lens — webpack 5 build.
 *
 * Replaces the original webpack 1.15 + node-sass + extract-text-webpack-plugin
 * configuration, which could not install or build on any current Node (webpack 1
 * paired with sass-loader 6, which requires webpack 2-4).
 *
 * The emitted layout is deliberately identical to the original, because the
 * manifest references these exact paths:
 *
 *   build/json_viewer/assets/<entry>.js
 *   build/json_viewer/assets/<entry>.css
 *   build/json_viewer/themes/<darkness>/<theme>.css   (moved by BuildExtension)
 *   build/json_viewer/{icons,pages}/...
 *   build/json_viewer/manifest.json
 */
const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BuildPaths = require('./lib/build-paths');
const BuildExtension = require('./lib/build-extension-webpack-plugin');

const manifestJson = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
const version = manifestJson.version;

const entries = {
  viewer: './extension/src/viewer.js',
  'viewer-alert': './extension/styles/viewer-alert.scss',
  options: './extension/src/options.js',
  backend: './extension/src/backend.js',
  omnibox: './extension/src/omnibox.js',
  'omnibox-page': './extension/src/omnibox-page.js',
  // MV3 allows one service_worker file; this entry bundles both background modules.
  'service-worker': './extension/src/service-worker.js',
  // Runs in the page MAIN world so window.json can be set without an inline script.
  'main-world': './extension/src/main-world.js',
};

function findThemes(darkness) {
  return fs
    .readdirSync(path.join('extension', 'themes', darkness))
    .filter((filename) => /\.js$/.test(filename))
    .map((theme) => theme.replace(/\.js$/, ''));
}

const themes = { light: findThemes('light'), dark: findThemes('dark') };

for (const darkness of ['light', 'dark']) {
  for (const theme of themes[darkness]) {
    entries[theme] = `./extension/themes/${darkness}/${theme}.js`;
  }
}

module.exports = (env, argv) => {
  const isProduction = (argv && argv.mode === 'production') || process.env.NODE_ENV === 'production';

  return {
    context: __dirname,
    entry: entries,
    output: {
      path: path.join(BuildPaths.EXTENSION, 'assets'),
      filename: '[name].js',
      clean: false,
    },
    devtool: false,
    module: {
      rules: [
        {
          test: /\.(css|scss)$/,
          use: [
            MiniCssExtractPlugin.loader,
            // url:false keeps emitted CSS byte-comparable to the original,
            // which shipped plain CSS with relative urls untouched.
            { loader: 'css-loader', options: { url: false, import: false } },
            { loader: 'sass-loader', options: { implementation: require('sass') } },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.css', '.scss'],
      // The original used resolve.root so that `require('json-viewer/...')`
      // resolves against extension/.
      modules: [path.resolve(__dirname, './extension'), 'node_modules'],
    },
    externals: {
      'chrome-framework': 'chrome',
    },
    optimization: {
      minimize: isProduction,
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: '[name].css' }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.VERSION': JSON.stringify(version),
        'process.env.THEMES': JSON.stringify(themes),
      }),
      // webpack 5 rejects unknown top-level config keys, so the theme list is
      // passed to the plugin directly rather than via compiler.options.
      new BuildExtension({ themes }),
    ],
    performance: { hints: false },
    stats: { errorDetails: true },
  };
};
