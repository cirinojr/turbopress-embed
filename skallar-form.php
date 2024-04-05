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
  private $skallar_form_options;

  public function __construct()
  {
    add_action('enqueue_block_editor_assets', [$this, 'gutenberg_scripts']);
    add_action('enqueue_block_assets', [$this, 'form_enqueue']);
    add_action('wp_ajax_send_form', [$this, 'send_form']);
    add_action('wp_ajax_nopriv_send_form', [$this, 'send_form']);

    add_action('wp_ajax_load_ac', [$this, 'loadAC']);
    add_action('wp_ajax_nopriv_load_ac', [$this, 'loadAC']);

    add_action('admin_menu', [$this, 'skallar_form_add_plugin_page']);
    add_action('admin_init', [$this, 'skallar_form_page_init']);
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


    wp_enqueue_style('form-style', plugins_url('/build/form_css.css', __FILE__));
  }


  public function form_enqueue()
  {
    wp_enqueue_script('form-submit', plugins_url('/build/form.js', __FILE__), true);

    $ajax_nonce = wp_create_nonce('fs_nonce');

    wp_localize_script(
      'form-submit',
      'ajax_object',
      array('ajax_url' => admin_url('admin-ajax.php'), 'nonce' => $ajax_nonce)
    );

    wp_enqueue_style('form-style', plugins_url('/build/form_css.css', __FILE__));
  }


  public function loadAC(){
    
   
   
  
   
   $data_ac=include plugin_dir_path(__FILE__).'/conf/ac_keys.php';

    if (is_array($data_ac)) {
      
      $subdomains = array_keys($data_ac);
      foreach ($subdomains as $p)
        $field['subdomain'][$p] = $p;
    }
  
    echo  wp_json_encode($field, true);

  //return $field;
  
    
   wp_die();
  }

  public function send_form()
  {

    $name = sanitize_text_field($_POST['name']);
    $email = sanitize_text_field($_POST['email']);
    $site_url = home_url();
    $params = sanitize_text_field($_POST['params']);

    if (isset($_POST['nonce']) && wp_verify_nonce($_POST['nonce'], 'fs_nonce')) {


      $request_data['nome'] = $name;
      $request_data['email'] = $email;
      $request_data['site_url'] = $site_url;
      $request_data['params'] = $params;


      $api_url = get_option('endpoint');
      $token = get_option('token_api');

      if ($api_url) {

        $response = wp_remote_post(
          $api_url,
          array(
            'headers' => array(
              'Authorization' => 'Basic ' . $token,
            ),
            'body'    => json_encode($request_data),
          )
        );

        if (is_wp_error($response)) {
          echo 'Error: ' . $response->get_error_message();
        } else {
          // Process the response.
          $body = wp_remote_retrieve_body($response);
          $data = json_decode($body);

          // Use $data as needed.
        }
      }
      echo  wp_json_encode($request_data, true);

      wp_die();
    } else {

      $response = array('success' => false, 'message' => 'Nonce verification failed');
      echo wp_json_encode($response);
    }
  }


  public function skallar_form_add_plugin_page()
  {
    add_menu_page(
      'Skallar Form', // page_title
      'Skallar Form', // menu_title
      'manage_options', // capability
      'skallar-form', // menu_slug
      array($this, 'skallar_form_create_admin_page'), // function
      'dashicons-admin-settings', // icon_url
      2 // position
    );
  }

  public function skallar_form_create_admin_page()
  {
    $this->skallar_form_options = get_option('skallar_form_option_name'); ?>

    <div class="wrap">
      <h2>Skallar Form</h2>
      <p>Página de configuração do formulário Skallar Digital</p>
      <?php settings_errors(); ?>

      <form method="post" action="options.php">
        <?php
        settings_fields('skallar_form_option_group');
        do_settings_sections('skallar-form-admin');
        submit_button();
        ?>
      </form>
    </div>
<?php }

  public function skallar_form_page_init()
  {
    register_setting(
      'skallar_form_option_group', // option_group
      'skallar_form_option_name', // option_name
      array($this, 'skallar_form_sanitize') // sanitize_callback
    );

    add_settings_section(
      'skallar_form_setting_section', // id
      'Settings', // title
      array($this, 'skallar_form_section_info'), // callback
      'skallar-form-admin' // page
    );

    add_settings_field(
      'endpoint', // id
      'Endpoint', // title
      array($this, 'endpoint_callback'), // callback
      'skallar-form-admin', // page
      'skallar_form_setting_section' // section
    );

    add_settings_field(
      'token_api', // id
      'TOKEN API', // title
      array($this, 'token_api_callback'), // callback
      'skallar-form-admin', // page
      'skallar_form_setting_section' // section
    );

    add_settings_field(
      'token_recapcha_2', // id
      'TOKEN Recapcha', // title
      array($this, 'token_recapcha_2_callback'), // callback
      'skallar-form-admin', // page
      'skallar_form_setting_section' // section
    );

    add_settings_field(
      'gtm_3', // id
      'GTM', // title
      array($this, 'gtm_3_callback'), // callback
      'skallar-form-admin', // page
      'skallar_form_setting_section' // section
    );
  }

  public function skallar_form_sanitize($input)
  {
    $sanitary_values = array();
    if (isset($input['endpoint'])) {
      $sanitary_values['endpoint'] = sanitize_text_field($input['endpoint']);
    }

    if (isset($input['token_api'])) {
      $sanitary_values['token_api'] = sanitize_text_field($input['token_api']);
    }

    if (isset($input['token_recapcha_2'])) {
      $sanitary_values['token_recapcha_2'] = sanitize_text_field($input['token_recapcha_2']);
    }

    if (isset($input['gtm_3'])) {
      $sanitary_values['gtm_3'] = sanitize_text_field($input['gtm_3']);
    }

    return $sanitary_values;
  }

  public function skallar_form_section_info()
  {
  }

  public function endpoint_callback()
  {
    printf(
      '<input class="regular-text" type="text" name="skallar_form_option_name[endpoint]" id="endpoint" value="%s">',
      isset($this->skallar_form_options['endpoint']) ? esc_attr($this->skallar_form_options['endpoint']) : ''
    );
  }

  public function token_api_callback()
  {
    printf(
      '<input class="regular-text" type="text" name="skallar_form_option_name[token_api]" id="token_api" value="%s">',
      isset($this->skallar_form_options['token_api']) ? esc_attr($this->skallar_form_options['token_api']) : ''
    );
  }

  public function token_recapcha_2_callback()
  {
    printf(
      '<input class="regular-text" type="text" name="skallar_form_option_name[token_recapcha_2]" id="token_recapcha_2" value="%s">',
      isset($this->skallar_form_options['token_recapcha_2']) ? esc_attr($this->skallar_form_options['token_recapcha_2']) : ''
    );
  }

  public function gtm_3_callback()
  {
    printf(
      '<input class="regular-text" type="text" name="skallar_form_option_name[gtm_3]" id="gtm_3" value="%s">',
      isset($this->skallar_form_options['gtm_3']) ? esc_attr($this->skallar_form_options['gtm_3']) : ''
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


$skallar_form = SkallarForm::get_instance();
