=== TurboPress Embed ===
Contributors: cirinojr
Donate link: https://dev.claudiocirino.com
Tags: embed, performance, gutenberg, social media, portfolio
Requires at least: 6.0
Requires PHP: 8.0
Tested up to: 7.0
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Performance-first Gutenberg embeds and premium developer portfolio blocks.

== Description ==

TurboPress Embed creates lightweight previews for third-party content and loads heavy players only after visitor interaction where supported. It also includes reusable blocks for developer projects, source code, technology stacks, case studies and metrics.

= Embed providers =

* YouTube
* Spotify
* TikTok
* X / Twitter
* SoundCloud
* Vimeo
* GitHub Gist
* Bluesky
* Twitch
* Smart URL
* CodePen
* Loom
* Figma

= Developer portfolio blocks =

* GitHub Project
* GitHub Code
* Tech Stack
* Project Case Study
* Project Metrics

= Highlights =

* Click-to-load previews reduce initial third-party requests
* Native Gutenberg blocks with provider-specific assets
* Accessible keyboard interaction, focus states and readable contrast
* Namespaced styles reduce conflicts with themes
* No jQuery dependency

== Installation ==

1. Upload the plugin to `/wp-content/plugins/` or install it through Plugins > Add New.
2. Activate TurboPress Embed.
3. Open the block editor and search for TurboPress.

== Frequently Asked Questions ==

= Will embeds still work if JavaScript is blocked? =

Interactive click-to-load embeds require JavaScript. Their initial preview remains available when JavaScript is blocked.

= Where is the development source? =

The source and build configuration are available at https://github.com/cirinojr/turbopress-embed.

== Changelog ==

= 1.1.0 =
* Added Vimeo, GitHub Gist, Bluesky, Twitch, Smart URL, CodePen, Loom and Figma blocks.
* Added GitHub Project, GitHub Code, Tech Stack, Project Case Study and Project Metrics blocks.
* Redesigned developer project and code presentations.
* Improved TikTok preview loading and interaction.
* Improved CodePen URL parsing and embed rendering.
* Completed accessibility and WCAG 2.2 AA improvements across the block suite.
* Simplified shared provider architecture and reusable components.

= 1.0.0 =
* Initial release with YouTube, Spotify, TikTok, X / Twitter and SoundCloud blocks.
