// Import the original config from the @wordpress/scripts package.
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );


// Import the helper to find and generate the entry points in the src directory
const { getWebpackEntryPoints } = require( '@wordpress/scripts/utils/config' );


// Add a new entry point by extending the Webpack config.
module.exports = {
   ...defaultConfig,
   entry: {
       ...getWebpackEntryPoints(),
       blocks: './blocks/index.js',
       editor_js: './assets/scripts/editor.js',
       editor_css: './assets/styles/editor.css',

   },
};
