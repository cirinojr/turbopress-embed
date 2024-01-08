<?php

/**
 
 * @since             1.0.0
 * @package           Skallar_form
 * @wordpress-plugin
 * Plugin Name:       Skallar Form v6
 * Description:       descrição aqui
 * Version:           6.0.0
 * Author:            Claudio Cirino jr
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       skallar-form
 * Domain Path:       /languages
 */



defined('ABSPATH') || exit;

class SkallarForm
{

  protected static $instance = null;


  public function __construct()
  {
    add_action('enqueue_block_editor_assets', [$this, 'gutenberg_scripts']);
    add_action('enqueue_block_assets', [$this, 'form_enqueue']);
    add_action('wp_ajax_send_form', [$this, 'send_form']);
    add_action('wp_ajax_nopriv_send_form', [$this, 'send_form']);
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

    // $ajax_nonce = wp_create_nonce('tb_nonce');

    // wp_localize_script(
    //   'embed-gutenberg-scripts',
    //   'ajax_object',
    //   array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => $ajax_nonce)
    // );

    wp_enqueue_style('form-style', plugins_url('/assets/styles/form.css', __FILE__));
  }


  public function form_enqueue()
  {
    wp_enqueue_script('form-submit', plugins_url('/assets/scripts/form-submit.js', __FILE__), true);

    $ajax_nonce = wp_create_nonce('fs_nonce');

    wp_localize_script(
      'form-submit',
      'ajax_object',
      array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => $ajax_nonce)
    );

    wp_enqueue_style('form-style', plugins_url('/assets/styles/form.css', __FILE__));
  }

  public function send_form()
  {
   $name = sanitize_text_field($_POST['name']);
   $email = sanitize_text_field($_POST['email']);
   $site_url= home_url();
   $params= sanitize_text_field($_POST['params']);

    if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'fs_nonce')) {

    
      $result['nome'] = $name;
      $result['email'] = $email;
      $result['site_url'] = $site_url;
      $result['params'] = $params;
      

      echo  wp_json_encode($result, true);

      wp_die();
    } else {

      $response = array('success' => false, 'message' => 'Nonce verification failed');
      echo wp_json_encode($response);
    }
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


$skallar_form = SkallarForm::get_instance();
