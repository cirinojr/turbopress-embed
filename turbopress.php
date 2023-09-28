<?php

/**
 * @link              https://dev.claudiocirino.com
 * @since             1.0.0
 * @package           Turbopress_Embed
 *
 * @wordpress-plugin
 * Plugin Name:       TurboPress Embed
 * Plugin URI:        https://dev.claudiocirino.com
 * Description:       Embed block plugin for Gutenberg that allows you to generate previews of third-party embedded media without unnecessary loading of content that causes slow page loading
 * Version:           1.0.0
 * Author:            Claudio Cirino jr
 * Author URI:        https://dev.claudiocirino.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       turbopress-embed
 * Domain Path:       /languages
 */



defined('ABSPATH') || exit;

class TurboPress
{

  protected static $instance = null;


  public function __construct()
  {
    add_action('enqueue_block_editor_assets', [$this, 'gutenberg_scripts']);
    add_action('wp_ajax_get_loadfile', [$this, 'loadFile']);
    add_action('wp_ajax_nopriv_get_loadfile', [$this, 'loadFile']);
    add_action('wp_ajax_get_spotify', [$this, 'getSpotify']);
    add_action('wp_ajax_nopriv_get_spotify', [$this, 'getSpotify']);
    add_action('wp_ajax_get_youtube', [$this, 'getYoutube']);
    add_action('wp_ajax_nopriv_get_youtube', [$this, 'getYoutube']);

  }

  public function curlRequest($url, $agent = false)
  {

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if ($agent) {
      $agent = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';
      curl_setopt($ch, CURLOPT_USERAGENT, $agent);
    }
    curl_setopt($ch, CURLOPT_URL, $url);


    $response = curl_exec($ch);

    if (curl_errno($ch)) {
      return 'cURL Error: ' . curl_error($ch);
    }

    curl_close($ch);

    return $response;
  }

  public function getSpotify()
  {

    $base_url = 'https://open.spotify.com/embed/episode/' . $_POST['id'];
    $html = $this->curlRequest($base_url);
    $doc = new DOMDocument();
    $doc->loadHTML($html);
    $scripts = $doc->getElementsByTagName('script');

    for ($i = 0; $i < $scripts->length; $i++) {
      $script = $scripts->item($i);
      if ('__NEXT_DATA__' === $script->getAttribute('id')) {
        echo  $script->nodeValue;
      }
    }


    wp_die();
  }

  public function loadFile()
  {
    $base_url = plugins_url($_POST['id'], __FILE__);
    echo file_get_contents($base_url);
    // echo $file;
    //echo $base_url;
    wp_die();
  }

  public function getYoutube()
  {
    $base_url = 'https://www.youtube.com/watch?v=' . $_POST['id'];
    $html = $this->curlRequest($base_url);


    if (preg_match('/<meta name="title" content="(.*?)">/', $html, $matches)) {
      $result['title'] = $matches[1];
    }

    if (preg_match('/"teaserAvatar":\s*{"thumbnails":\s*\[{"url":\s*"([^"]+)"/', $html, $matches)) {
      $result['thumb'] = $matches[1];
    }

    echo  json_encode($result, true);
    wp_die();
  }


  public function gutenberg_scripts()
  {
    wp_enqueue_script(
      'embed-gutenberg-scripts',
      plugins_url('/build/index.js', __FILE__),
      ['wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components',],
      plugins_url('/build/index.js', __FILE__),
      true
    );
  }


  public static function get_instance()
  {

    if (null === self::$instance) {
      self::$instance = new self;
    }

    return self::$instance;
  }


  public function activate()
  {
    global $wp_rewrite;
    $this->flush_rewrite_rules();
  }

  public function flush_rewrite_rules()
  {
    global $wp_rewrite;
    $wp_rewrite->flush_rules();
  }
}


$turbo_press = TurboPress::get_instance();
