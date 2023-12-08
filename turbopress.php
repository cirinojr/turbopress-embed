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
    add_action('wp_ajax_get_spotify', [$this, 'getSpotify']);
    add_action('wp_ajax_nopriv_get_spotify', [$this, 'getSpotify']);
    add_action('wp_ajax_get_youtube', [$this, 'getYoutube']);
    add_action('wp_ajax_nopriv_get_youtube', [$this, 'getYoutube']);
    add_action('wp_ajax_get_vimeo', [$this, 'getVimeo']);
    add_action('wp_ajax_nopriv_get_vimeo', [$this, 'getVimeo']);
  }


  public function getSpotify()
  {

    $id = sanitize_text_field($_POST['id']);

    if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'tb_nonce') && current_user_can('edit_posts')) {

      $url_data = wp_remote_get($id);
      $html     = wp_remote_retrieve_body($url_data);

      if (preg_match('/<title>(.*?)<\/title>/', $html, $matches)) {
        $result['title'] = $matches[1];
      }

      if (preg_match('/<meta property="og:image" content="(.*?)"\/>/', $html, $matches)) {
        $result['cover'] = $matches[1];
      }

      if (preg_match('/<meta name="music:duration" content="(.*?)"\/>/', $html, $matches)) {
        $result['duration'] = $matches[1];
      }


      echo  wp_json_encode($result, true);
    } else {

      $response = array('success' => false, 'message' => 'Nonce verification failed');
      echo wp_json_encode($response);
    }

    wp_die();
  }


  public function getYoutube()
  {
    $id = sanitize_text_field($_POST['id']);

    if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'tb_nonce') && current_user_can('edit_posts')) {

      $url_data = wp_remote_get('https://www.youtube.com/watch?v=' . $id);
      $html     = wp_remote_retrieve_body($url_data);


      if (preg_match('/<meta name="title" content="(.*?)">/', $html, $matches)) {
        $result['title'] = $matches[1];
      }

      if (preg_match('/"teaserAvatar":\s*{"thumbnails":\s*\[{"url":\s*"([^"]+)"/', $html, $matches)) {
        $result['thumb'] = $matches[1];
      }

      echo  wp_json_encode($result, true);
    } else {

      $response = array('success' => false, 'message' => 'Nonce verification failed');
      echo wp_json_encode($response);
    }
    wp_die();
  }

  public function getVimeo()
  {

    $id = sanitize_text_field($_POST['id']);

    if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'tb_nonce') && current_user_can('edit_posts')) {

      $url_data = wp_remote_get('http://vimeo.com/api/v2/video/' . $id . '.xml');
      $xml     = wp_remote_retrieve_body($url_data);

      if (preg_match('/<title>(.*?)<\/title>/', $xml, $matches)) {
        $result['title'] = $matches[1];
      }

      if (preg_match('/<description>(.*?)<\/description>/', $xml, $matches)) {
        $result['description'] = $matches[1];
      }

      if (preg_match('/<user_name>(.*?)<\/user_name>/', $xml, $matches)) {
        $result['user_name'] = $matches[1];
      }

      if (preg_match('/<user_portrait_small>(.*?)<\/user_portrait_small>/', $xml, $matches)) {
        $result['user_portrait_small'] = $matches[1];
      }


      if (preg_match('/<thumbnail_large>(.*?)<\/thumbnail_large>/', $xml, $matches)) {
        $result['thumb'] = $matches[1];
      }

      echo  wp_json_encode($result, true);
    } else {

      $response = array('success' => false, 'message' => 'Nonce verification failed');
      echo wp_json_encode($response);
    }
    wp_die();
  }


  public function gutenberg_scripts()
  {
    wp_enqueue_script(
      'embed-gutenberg-scripts',
      plugins_url('/build/blocks.js', __FILE__),
      ['wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components',],
      plugins_url('/build/blocks.js', __FILE__),
      true
    );

    $ajax_nonce = wp_create_nonce('tb_nonce');

    wp_localize_script(
      'embed-gutenberg-scripts',
      'ajax_object',
      array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => $ajax_nonce)
    );

    wp_enqueue_style('tbe-style', plugins_url('/build/imports.css', __FILE__));
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
