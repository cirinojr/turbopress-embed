=== TurboPress Embed ===
Contributors: cirinojr
Donate link: https://dev.claudiocirino.com
Tags: embed, pagespeed, youtube, spotify, performance, gutenberg
Requires at least: 5.3
Tested up to: 6.6
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Performance-first Gutenberg embed blocks for YouTube and Spotify with click-to-load players.

== Description ==

TurboPress Embed creates lightweight preview cards and only loads the real iframe player after user interaction.
This reduces initial page cost and avoids unnecessary third-party requests.

= Supported providers =

* YouTube
* Spotify
* TikTok
* X / Twitter
* SoundCloud

= Why use it =

* Better runtime performance than loading heavy embeds on first paint
* Predictable CSS namespace to reduce theme conflicts
* Accessible interaction (focus-visible, keyboard-friendly button trigger)
* No jQuery dependency

= How it works =

1. Add a TurboPress block in Gutenberg.
2. Paste a valid provider URL.
3. The block stores metadata for the preview card.
4. Frontend loads the iframe only when the visitor clicks.

= Technical notes =

* Frontend scripts/styles are registered per block
* Uses WordPress block registration flow and editor-specific metadata requests
* Styled with namespaced BEM-like classes to avoid global collisions

== Installation ==

1. Upload the plugin to `/wp-content/plugins/` or install through Plugins > Add New.
2. Activate TurboPress Embed.
3. Open the block editor and search for TurboPress YouTube or TurboPress Spotify.

== FAQ ==

= Will embeds still work if JavaScript is blocked? =

The click-to-load behavior requires JavaScript. Without JS, only the preview card is shown.

== Changelog ==

= 1.0.0 =
* Added support for TikTok, X/Twitter and SoundCloud with click-to-load embeds.





