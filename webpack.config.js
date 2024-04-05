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
<<<<<<< HEAD
       form: './assets/scripts/form-submit.js',
       form_css: './assets/styles/form.scss'
=======
       yt_css: './assets/styles/youtube.css',
       yt_js: './assets/scripts/youtube.js',
       vm_css: './assets/styles/vimeo.css',
       vm_js: './assets/scripts/vimeo.js',
       sf_css: './assets/styles/spotify.css',
       sf_js: './assets/scripts/spotify.js',
       imports: './assets/styles/imports.css',
>>>>>>> 24110ecb766ae3e8b2f0f53831dc71eabfd2bd02
   },
};
