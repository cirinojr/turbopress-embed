<?php

/**
 * Plugin Name: Embedded Preview Generator
 * Description: Plugin embed
 * Author: Claudio Cirino jr
 */


defined('ABSPATH') || exit;

// //defines
// define( 'EPG_VERSION', '1.0' );
// define( 'EPG__MINIMUM_WP_VERSION', '5.0' );
// define( 'EPG__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
// define( 'EPG_DELETE_LIMIT', 10000 );


// require_once( EPG__PLUGIN_DIR . 'class.api.php' );

class MagicEmbed
{

  protected static $instance = null;


  public function __construct()
  {
    add_action('enqueue_block_editor_assets', [$this, 'gutenberg_scripts']);
    add_action('admin_enqueue_scripts', [$this, 'enqueueAdmin']);
    add_action('wp_ajax_get_spotify', [$this, 'getSpotify']);
    add_action('wp_ajax_nopriv_get_spotify', [$this, 'getSpotify']);
    add_action('wp_enqueue_scripts', [$this, 'enqueueJs']);
  }

  public function curlRequest($url)
  {
    $agent = 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, $agent);
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

  public function enqueueAdmin(){
    wp_enqueue_style('epg-style', plugins_url('/build/editor_css.css', __FILE__), array(), '1.0');
    wp_enqueue_script('epg-script', plugins_url('/build/editor_js.js', __FILE__), array(), '1.0', true);
  }

  public function enqueueJs()
  {

    wp_register_script('embeded', plugins_url('/build/embed.js', __FILE__), array(), '1.0', true);
    wp_enqueue_script('embeded');

    //wp_enqueue_style('spotify', plugins_url('/builds/spotify.css', __FILE__), false, '1.0', 'all');
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


$magic_embed = MagicEmbed::get_instance();
