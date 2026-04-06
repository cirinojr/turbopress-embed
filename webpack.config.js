// Import the original config from the @wordpress/scripts package.
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );


// Add a new entry point by extending the Webpack config.
module.exports = {
   ...defaultConfig,
   entry: {
       blocks: './blocks/index.js',
       yt_css: './assets/styles/youtube.css',
       yt_js: './assets/scripts/youtube.js',
       sf_css: './assets/styles/spotify.css',
       sf_js: './assets/scripts/spotify.js',
       tt_css: './assets/styles/tiktok.css',
       tt_js: './assets/scripts/tiktok.js',
       tw_css: './assets/styles/twitter.css',
       tw_js: './assets/scripts/twitter.js',
       sc_css: './assets/styles/soundcloud.css',
       sc_js: './assets/scripts/soundcloud.js',
       editor_css: './assets/styles/editor.css',
   },
};
