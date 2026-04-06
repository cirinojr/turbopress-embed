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

final class TurboPress
{
    private const VERSION = '1.0.0';
    private const CACHE_VERSION = '2';
    private const CACHE_TTL = 21600;
    private const REMOTE_TIMEOUT = 8;

    protected static $instance = null;

    public static function getInstance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function __construct()
    {
        add_action('init', array($this, 'registerAssetsAndBlocks'));
        add_action('wp_ajax_tpe_get_spotify', array($this, 'getSpotify'));
        add_action('wp_ajax_tpe_get_youtube', array($this, 'getYoutube'));
        add_action('wp_ajax_tpe_get_tiktok', array($this, 'getTikTok'));
        add_action('wp_ajax_tpe_get_twitter', array($this, 'getTwitter'));
        add_action('wp_ajax_tpe_get_soundcloud', array($this, 'getSoundCloud'));
    }

    public function registerAssetsAndBlocks()
    {
        wp_register_script(
            'turbopress-embed-editor',
            plugins_url('build/blocks.js', __FILE__),
            array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components'),
            self::VERSION,
            true
        );

        wp_localize_script(
            'turbopress-embed-editor',
            'turbopressEmbedConfig',
            array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce'   => wp_create_nonce('turbopress_embed_editor_nonce'),
            )
        );

        wp_register_script(
            'turbopress-embed-youtube-view',
            plugins_url('build/yt_js.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        wp_register_script(
            'turbopress-embed-spotify-view',
            plugins_url('build/sf_js.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        wp_register_script(
            'turbopress-embed-tiktok-view',
            plugins_url('build/tt_js.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        wp_register_script(
            'turbopress-embed-twitter-view',
            plugins_url('build/tw_js.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        wp_register_script(
            'turbopress-embed-soundcloud-view',
            plugins_url('build/sc_js.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        wp_register_style(
            'turbopress-embed-editor-style',
            plugins_url('build/editor_css.css', __FILE__),
            array(),
            self::VERSION
        );

        wp_register_style(
            'turbopress-embed-youtube-style',
            plugins_url('build/yt_css.css', __FILE__),
            array(),
            self::VERSION
        );

        wp_register_style(
            'turbopress-embed-spotify-style',
            plugins_url('build/sf_css.css', __FILE__),
            array(),
            self::VERSION
        );

        wp_register_style(
            'turbopress-embed-tiktok-style',
            plugins_url('build/tt_css.css', __FILE__),
            array(),
            self::VERSION
        );

        wp_register_style(
            'turbopress-embed-twitter-style',
            plugins_url('build/tw_css.css', __FILE__),
            array(),
            self::VERSION
        );

        wp_register_style(
            'turbopress-embed-soundcloud-style',
            plugins_url('build/sc_css.css', __FILE__),
            array(),
            self::VERSION
        );

        register_block_type(__DIR__ . '/blocks/youtube');
        register_block_type(__DIR__ . '/blocks/spotify');
        register_block_type(__DIR__ . '/blocks/tiktok');
        register_block_type(__DIR__ . '/blocks/twitter');
        register_block_type(__DIR__ . '/blocks/soundcloud');
    }

    public function getYoutube()
    {
        $this->handleProviderRequest('youtube');
    }

    public function getSpotify()
    {
        $this->handleProviderRequest('spotify');
    }

    public function getTikTok()
    {
        $this->handleProviderRequest('tiktok');
    }

    public function getTwitter()
    {
        $this->handleProviderRequest('twitter');
    }

    public function getSoundCloud()
    {
        $this->handleProviderRequest('soundcloud');
    }

    private function handleProviderRequest($provider)
    {
        $this->validateEditorRequest();

        $raw_url = isset($_POST['url']) ? wp_unslash($_POST['url']) : '';
        $url     = esc_url_raw($raw_url);

        if (empty($url)) {
            wp_send_json_error(array('message' => __('Invalid embed URL.', 'turbopress-embed')), 400);
        }

        $metadata = $this->resolveProviderMetadata($provider, $url);

        if ($this->isErrorResult($metadata)) {
            $status_code = 400;
            if ('remote_error' === $metadata['code']) {
                $status_code = 500;
            }

            wp_send_json_error(array('message' => $metadata['message']), $status_code);
        }

        wp_send_json_success($metadata);
    }

    private function resolveProviderMetadata($provider, $url)
    {
        $config = $this->getProviderConfig($provider);

        if (empty($config)) {
            return $this->errorResult('invalid_provider', __('Unsupported provider.', 'turbopress-embed'));
        }

        if (!$this->isSupportedHost($url, $config['hosts'])) {
            return $this->errorResult('invalid_host', __('Unsupported URL host for this provider.', 'turbopress-embed'));
        }

        $cache_key = 'tpe_embed_' . self::CACHE_VERSION . '_' . md5($provider . '|' . $url);
        $cached    = get_transient($cache_key);

        if (is_array($cached)) {
            return $cached;
        }

        $request_url = add_query_arg($config['query_args'], $config['endpoint']);
        $request_url = add_query_arg('url', $url, $request_url);

        $response = wp_safe_remote_get(
            $request_url,
            array(
                'timeout'     => self::REMOTE_TIMEOUT,
                'redirection' => 3,
                'user-agent'  => 'TurboPress Embed/' . self::VERSION . '; ' . home_url('/'),
            )
        );

        if (is_wp_error($response)) {
            return $this->errorResult('remote_error', __('Provider request failed.', 'turbopress-embed'));
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status > 299) {
            return $this->errorResult('remote_error', __('Provider request returned an invalid status code.', 'turbopress-embed'));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!is_array($data)) {
            return $this->errorResult('remote_error', __('Provider response is malformed.', 'turbopress-embed'));
        }

        $normalized = $this->normalizeProviderPayload($provider, $url, $data);

        if ($this->isErrorResult($normalized)) {
            return $normalized;
        }

        set_transient($cache_key, $normalized, self::CACHE_TTL);

        return $normalized;
    }

    private function normalizeProviderPayload($provider, $url, $data)
    {
        if ('youtube' === $provider) {
            return $this->normalizeYoutubePayload($url, $data);
        }

        if ('spotify' === $provider) {
            return $this->normalizeSpotifyPayload($url, $data);
        }

        if ('tiktok' === $provider) {
            return $this->normalizeTikTokPayload($url, $data);
        }

        if ('twitter' === $provider) {
            return $this->normalizeTwitterPayload($url, $data);
        }

        if ('soundcloud' === $provider) {
            return $this->normalizeSoundCloudPayload($url, $data);
        }

        return $this->errorResult('invalid_provider', __('Unsupported provider.', 'turbopress-embed'));
    }

    private function normalizeYoutubePayload($url, $data)
    {
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';
        $thumb = isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '';

        if ('' === $title && '' === $thumb) {
            return $this->errorResult('remote_error', __('YouTube did not return enough preview data.', 'turbopress-embed'));
        }

        return array(
            'provider'  => 'youtube',
            'url'       => $url,
            'title'     => $title,
            'thumbnail' => $thumb,
        );
    }

    private function normalizeSpotifyPayload($url, $data)
    {
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';
        if ('' === $title) {
            return $this->errorResult('remote_error', __('Spotify did not return enough preview data.', 'turbopress-embed'));
        }

        return array(
            'provider'  => 'spotify',
            'url'       => $url,
            'title'     => $title,
            'thumbnail' => isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '',
        );
    }

    private function normalizeTikTokPayload($url, $data)
    {
        $html = isset($data['html']) ? $this->sanitizeEmbedMarkup($data['html']) : '';

        if ('' === $html) {
            return $this->errorResult('remote_error', __('TikTok did not return embeddable content.', 'turbopress-embed'));
        }

        return array(
            'provider'   => 'tiktok',
            'url'        => $url,
            'title'      => isset($data['title']) ? sanitize_text_field($data['title']) : '',
            'thumbnail'  => isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '',
            'authorName' => isset($data['author_name']) ? sanitize_text_field($data['author_name']) : '',
            'embedHtml'  => $html,
        );
    }

    private function normalizeTwitterPayload($url, $data)
    {
        $html  = isset($data['html']) ? $this->sanitizeEmbedMarkup($data['html']) : '';
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';

        if ('' === $html) {
            return $this->errorResult('remote_error', __('X/Twitter did not return embeddable content.', 'turbopress-embed'));
        }

        if ('' === $title) {
            $title = __('Post from X', 'turbopress-embed');
        }

        return array(
            'provider'   => 'twitter',
            'url'        => $url,
            'title'      => $title,
            'authorName' => isset($data['author_name']) ? sanitize_text_field($data['author_name']) : '',
            'embedHtml'  => $html,
        );
    }

    private function normalizeSoundCloudPayload($url, $data)
    {
        $html = isset($data['html']) ? (string) $data['html'] : '';

        if (!preg_match('/src="([^"]+)"/i', $html, $matches)) {
            return $this->errorResult('remote_error', __('SoundCloud did not return a valid player.', 'turbopress-embed'));
        }

        return array(
            'provider'   => 'soundcloud',
            'url'        => $url,
            'title'      => isset($data['title']) ? sanitize_text_field($data['title']) : '',
            'thumbnail'  => isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '',
            'authorName' => isset($data['author_name']) ? sanitize_text_field($data['author_name']) : '',
            'playerUrl'  => esc_url_raw($matches[1]),
        );
    }

    private function errorResult($code, $message)
    {
        return array(
            'error'   => true,
            'code'    => $code,
            'message' => $message,
        );
    }

    private function isErrorResult($result)
    {
        return is_array($result) && !empty($result['error']);
    }

    private function sanitizeEmbedMarkup($html)
    {
        $cleaned = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', (string) $html);

        $allowed_tags = array(
            'blockquote' => array(
                'class'         => true,
                'cite'          => true,
                'style'         => true,
                'title'         => true,
                'data-video-id' => true,
                'data-embed-from' => true,
            ),
            'section'    => array(),
            'a'          => array(
                'href'   => true,
                'target' => true,
                'rel'    => true,
                'title'  => true,
            ),
            'p'          => array(
                'class' => true,
                'lang'  => true,
                'dir'   => true,
            ),
            'span'       => array(
                'class' => true,
            ),
            'br'         => array(),
        );

        return wp_kses($cleaned, $allowed_tags);
    }

    private function getProviderConfig($provider)
    {
        $providers = array(
            'youtube'    => array(
                'endpoint'   => 'https://www.youtube.com/oembed',
                'query_args' => array('format' => 'json'),
                'hosts'      => array('youtube.com', 'youtu.be'),
            ),
            'spotify'    => array(
                'endpoint'   => 'https://open.spotify.com/oembed',
                'query_args' => array(),
                'hosts'      => array('open.spotify.com'),
            ),
            'tiktok'     => array(
                'endpoint'   => 'https://www.tiktok.com/oembed',
                'query_args' => array(),
                'hosts'      => array('tiktok.com', 'vm.tiktok.com'),
            ),
            'twitter'    => array(
                'endpoint'   => 'https://publish.twitter.com/oembed',
                'query_args' => array(
                    'omit_script' => '1',
                    'dnt'         => 'true',
                ),
                'hosts'      => array('x.com', 'twitter.com'),
            ),
            'soundcloud' => array(
                'endpoint'   => 'https://soundcloud.com/oembed',
                'query_args' => array('format' => 'json'),
                'hosts'      => array('soundcloud.com', 'on.soundcloud.com'),
            ),
        );

        return isset($providers[$provider]) ? $providers[$provider] : array();
    }

    private function isSupportedHost($url, $supported_hosts)
    {
        $host = wp_parse_url($url, PHP_URL_HOST);

        if (empty($host)) {
            return false;
        }

        $host = strtolower($host);

        foreach ($supported_hosts as $supported_host) {
            $supported_host = strtolower($supported_host);

            if ($host === $supported_host || str_ends_with($host, '.' . $supported_host)) {
                return true;
            }
        }

        return false;
    }

    private function validateEditorRequest()
    {
        $nonce = isset($_POST['nonce']) ? sanitize_text_field(wp_unslash($_POST['nonce'])) : '';

        if (!wp_verify_nonce($nonce, 'turbopress_embed_editor_nonce')) {
            wp_send_json_error(array('message' => __('Invalid request nonce.', 'turbopress-embed')), 403);
        }

        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('message' => __('Insufficient permissions.', 'turbopress-embed')), 403);
        }
    }
}

TurboPress::getInstance();
