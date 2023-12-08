=== TurboPress Embed ===
Contributors: cirinojr
Donate link: https://dev.claudiocirino.com
Tags: embed, pagespeed, youtube, corewebvital
Requires at least: 5.3.3
Tested up to: 6.1.1
Stable tag: 1.0.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Plugin de blocos de embed para Gutenberg que permite gerar preview de mídias incorporadas de terceiros sem o carregamento desnecessário de conteúdo que ocasiona lentidão no carregamento das páginas

== Description ==


It is a Wordpress Gutenberg plugin that creates static content for your embedded video

=Benefits=

- Reduction of unnecessary requests
- Increased Score on Google Core Web Vitals

=What embedded content does this plugin support?=

YouTube
Vimeo
Spotify

=How it works?=

It's very easy, when adding the url to the block the plugin creates a static version of the embedded content based on the data returned by the url



== Installation ==


e.g.

1. Upload `turbopress-embed.php` to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Place `<?php do_action('plugin_name_hook'); ?>` in your templates





