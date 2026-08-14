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
 * Version:           1.1.0
 * Author:            Claudio Cirino jr
 * Author URI:        https://dev.claudiocirino.com
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       turbopress-embed
 * Domain Path:       /languages
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */



defined('ABSPATH') || exit;

require_once __DIR__ . '/includes/class-turbopress-remote-data.php';
require_once __DIR__ . '/includes/class-turbopress-nextgen-providers.php';
require_once __DIR__ . '/includes/class-turbopress-remote-image-cache.php';

final class TurboPress
{
    private const VERSION = '1.1.0';
    private const CACHE_VERSION = '3';
    private const CACHE_TTL = 21600;
    private const REMOTE_TIMEOUT = 8;
    private const LEGACY_PROVIDERS = array('youtube', 'spotify', 'tiktok', 'twitter', 'soundcloud');
    private const PROVIDER_CONFIGS = array(
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
            'query_args' => array('omit_script' => '1', 'dnt' => 'true'),
            'hosts'      => array('x.com', 'twitter.com'),
        ),
        'soundcloud' => array(
            'endpoint'   => 'https://soundcloud.com/oembed',
            'query_args' => array('format' => 'json'),
            'hosts'      => array('soundcloud.com', 'on.soundcloud.com'),
        ),
    );

    public function __construct()
    {
        add_action('init', array($this, 'registerAssetsAndBlocks'));
        foreach (self::LEGACY_PROVIDERS as $provider) {
            add_action('wp_ajax_tpe_get_' . $provider, array($this, 'handleProviderRequest'));
        }
        TurboPress_Remote_Data::init();
        TurboPress_Nextgen_Providers::init();
        TurboPress_Remote_Image_Cache::init();
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

        wp_register_style(
            'turbopress-embed-editor-style',
            plugins_url('build/editor_css.css', __FILE__),
            array(),
            self::VERSION
        );

        $provider_assets = array(
            'youtube'   => array('script' => 'yt_js', 'style' => 'yt_css'),
            'spotify'   => array('script' => 'sf_js', 'style' => 'sf_css'),
            'tiktok'    => array('script' => 'tt_js', 'style' => 'tt_css'),
            'twitter'   => array('script' => 'tw_js', 'style' => 'tw_css'),
            'soundcloud' => array('script' => 'sc_js', 'style' => 'sc_css'),
        );

        foreach ($provider_assets as $provider => $assets) {
            wp_register_script(
                'turbopress-embed-' . $provider . '-view',
                plugins_url('build/' . $assets['script'] . '.js', __FILE__),
                array(),
                self::VERSION,
                true
            );
            wp_register_style(
                'turbopress-embed-' . $provider . '-style',
                plugins_url('build/' . $assets['style'] . '.css', __FILE__),
                array(),
                self::VERSION
            );
        }

        $portfolio_asset_file = __DIR__ . '/build/portfolio.asset.php';
        $portfolio_asset = file_exists($portfolio_asset_file)
            ? require $portfolio_asset_file
            : array(
                'dependencies' => array('wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element'),
                'version' => self::VERSION,
            );
        $portfolio_asset['dependencies'] = array_values(array_unique(array_merge(
            $portfolio_asset['dependencies'],
            array('wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element')
        )));

        wp_register_script(
            'turbopress-portfolio-editor',
            plugins_url('build/portfolio.js', __FILE__),
            $portfolio_asset['dependencies'],
            $portfolio_asset['version'],
            true
        );

        wp_localize_script(
            'turbopress-portfolio-editor',
            'turbopressPortfolio',
            array(
                'restUrl' => esc_url_raw(rest_url(TurboPress_Remote_Data::REST_NAMESPACE . '/')),
                'nonce' => wp_create_nonce('wp_rest'),
            )
        );

        wp_register_style(
            'turbopress-portfolio-style',
            plugins_url('build/portfolio.css', __FILE__),
            array(),
            $portfolio_asset['version']
        );

        wp_register_script(
            'turbopress-portfolio-code-view',
            plugins_url('build/portfolio_view.js', __FILE__),
            array(),
            $portfolio_asset['version'],
            true
        );

        $nextgen_asset = file_exists(__DIR__ . '/build/nextgen.asset.php') ? require __DIR__ . '/build/nextgen.asset.php' : array('dependencies' => array('wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'), 'version' => self::VERSION);
        wp_register_script('turbopress-nextgen-editor', plugins_url('build/nextgen.js', __FILE__), $nextgen_asset['dependencies'], $nextgen_asset['version'], true);
        wp_localize_script('turbopress-nextgen-editor', 'turbopressEmbedConfig', array('ajaxUrl' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('turbopress_embed_editor_nonce')));
        wp_register_script('turbopress-nextgen-view', plugins_url('build/nextgen_view.js', __FILE__), array(), self::VERSION, true);
        wp_register_style('turbopress-nextgen-style', plugins_url('build/nextgen_css.css', __FILE__), array(), self::VERSION);

        foreach (array_keys($provider_assets) as $provider_block) {
            $block_options = 'youtube' === $provider_block
                ? array('render_callback' => array($this, 'renderYouTubeBlock'))
                : array();
            register_block_type(__DIR__ . '/blocks/' . $provider_block, $block_options);
        }

        $portfolio_blocks = array(
            'github-project',
            'github-code',
            'tech-stack',
            'project-case-study',
            'project-metrics',
        );

        foreach ($portfolio_blocks as $portfolio_block) {
            register_block_type(
                __DIR__ . '/blocks/' . $portfolio_block,
                array('render_callback' => array('TurboPress_Remote_Data', 'render_dynamic_block'))
            );
        }

        foreach (array('vimeo', 'github-gist', 'bluesky', 'twitch', 'smart-url', 'codepen', 'loom', 'figma') as $nextgen_block) {
            register_block_type(__DIR__ . '/blocks/' . $nextgen_block);
        }
    }

    /** Replace remote URLs in previously saved YouTube blocks at render time. */
    public function renderYouTubeBlock($attributes, $content)
    {
        $video_id = isset($attributes['videoId']) ? (string) $attributes['videoId'] : '';
        $url = isset($attributes['url']) && $attributes['url']
            ? $attributes['url']
            : $video_id;

        if (!$url) {
            return $content;
        }

        $metadata = TurboPress_Remote_Data::get_youtube_metadata($url);
        if (is_wp_error($metadata)) {
            return $content;
        }

        $local_thumbnail = isset($metadata['thumbnail']) ? esc_url_raw($metadata['thumbnail']) : '';
        $saved_thumbnail = isset($attributes['thumbnailUrl']) ? (string) $attributes['thumbnailUrl'] : '';
        $fallback_thumbnail = $video_id ? 'https://i.ytimg.com/vi/' . $video_id . '/hqdefault.jpg' : '';
        if ($local_thumbnail) {
            $content = str_replace(array_filter(array($saved_thumbnail, $fallback_thumbnail)), $local_thumbnail, $content);
        }

        $local_avatar = isset($metadata['channel']['thumbnail']) ? esc_url_raw($metadata['channel']['thumbnail']) : '';
        $saved_avatar = isset($attributes['channelThumbnail']) ? (string) $attributes['channelThumbnail'] : '';
        if ($local_avatar && $saved_avatar) {
            $content = str_replace($saved_avatar, $local_avatar, $content);
        }

        return $content;
    }

    public function handleProviderRequest()
    {
        $this->validateEditorRequest();
        $provider = str_replace('wp_ajax_tpe_get_', '', current_action());

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
        if ('youtube' === $provider) {
            $metadata = TurboPress_Remote_Data::get_youtube_metadata($url);

            if (is_wp_error($metadata)) {
                $code = 'turbopress_invalid_youtube_url' === $metadata->get_error_code()
                    ? 'invalid_url'
                    : 'remote_error';
                return $this->errorResult($code, __('Unable to load YouTube metadata.', 'turbopress-embed'));
            }

            return $metadata;
        }

        $config = self::PROVIDER_CONFIGS[$provider] ?? array();

        if (empty($config)) {
            return $this->errorResult('invalid_provider', __('Unsupported provider.', 'turbopress-embed'));
        }

        if ('spotify' === $provider) {
            $spotify_resource = $this->parseSpotifyUrl($url);
            if (empty($spotify_resource)) {
                return $this->errorResult('invalid_url', __('Invalid Spotify URL.', 'turbopress-embed'));
            }

            $url = $this->getSpotifyPublicUrl($spotify_resource);
        }

        if ('tiktok' === $provider) {
            $tiktok_resource = $this->parseTikTokVideoUrl($url);
            if (is_array($tiktok_resource)) {
                $url = $this->getTikTokVideoUrl($tiktok_resource);
            }
        }

        if (!$this->isSupportedHost($url, $config['hosts'])) {
            return $this->errorResult('invalid_host', __('Unsupported URL host for this provider.', 'turbopress-embed'));
        }

        $cache_identity = $url;
        if ('tiktok' === $provider) {
            $cache_identity = isset($tiktok_resource['id'])
                ? 'preview:2|video:' . $tiktok_resource['id']
                : 'preview:2|url:' . $url;
        }
        $cache_key = 'tpe_embed_' . self::CACHE_VERSION . '_' . md5($provider . '|' . $cache_identity);
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

    private function normalizeSpotifyPayload($url, $data)
    {
        $resource = $this->parseSpotifyUrl($url);
        $title = isset($data['title']) ? sanitize_text_field($data['title']) : '';
        if (empty($resource) || '' === $title) {
            return $this->errorResult('remote_error', __('Spotify did not return enough preview data.', 'turbopress-embed'));
        }

        return array(
            'provider'  => 'spotify',
            'url'       => $this->getSpotifyPublicUrl($resource),
            'type'      => $resource['type'],
            'id'        => $resource['id'],
            'embedUrl'  => $this->getSpotifyEmbedUrl($resource),
            'title'     => $title,
            'thumbnail' => TurboPress_Remote_Image_Cache::localize(
                isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '',
                'spotify', $resource['type'] . ':' . $resource['id'], 'artwork'
            ),
        );
    }

    private function parseSpotifyUrl($url)
    {
        $parts = wp_parse_url($url);
        if (
            !is_array($parts) ||
            !isset($parts['scheme'], $parts['host'], $parts['path']) ||
            'https' !== strtolower($parts['scheme']) ||
            'open.spotify.com' !== strtolower($parts['host'])
        ) {
            return null;
        }

        $path_parts = array_values(array_filter(explode('/', trim($parts['path'], '/')), 'strlen'));
        $is_embed   = isset($path_parts[0]) && 'embed' === $path_parts[0];
        $type_index = $is_embed ? 1 : 0;
        $id_index   = $is_embed ? 2 : 1;
        $type       = isset($path_parts[$type_index]) ? $path_parts[$type_index] : '';
        $id         = isset($path_parts[$id_index]) ? $path_parts[$id_index] : '';
        $types      = array('track', 'album', 'playlist', 'episode', 'artist', 'show');
        $expected   = $is_embed && 'show' === $type ? 4 : ($is_embed ? 3 : 2);

        if (
            count($path_parts) !== $expected ||
            !in_array($type, $types, true) ||
            !preg_match('/^[A-Za-z0-9]{10,64}$/', $id) ||
            ($is_embed && 'show' === $type && 'video' !== $path_parts[3])
        ) {
            return null;
        }

        return array('type' => $type, 'id' => $id);
    }

    private function getSpotifyPublicUrl($resource)
    {
        return 'https://open.spotify.com/' . $resource['type'] . '/' . $resource['id'];
    }

    private function getSpotifyEmbedUrl($resource)
    {
        $suffix = 'show' === $resource['type'] ? '/video' : '';
        return 'https://open.spotify.com/embed/' . $resource['type'] . '/' . $resource['id'] . $suffix;
    }

    private function normalizeTikTokPayload($url, $data)
    {
        $html = isset($data['html']) ? $this->sanitizeEmbedMarkup($data['html']) : '';

        if ('' === $html) {
            return $this->errorResult('remote_error', __('TikTok did not return embeddable content.', 'turbopress-embed'));
        }

        $structured = $this->parseTikTokEmbedHtml($html);
        $resource   = $this->parseTikTokVideoUrl($url);
        if (!is_array($resource) && !empty($structured['videoId']) && !empty($structured['username'])) {
            $resource = array('id' => $structured['videoId'], 'username' => $structured['username']);
        }

        $username = is_array($resource) ? $resource['username'] : $structured['username'];
        $video_id = is_array($resource) ? $resource['id'] : $structured['videoId'];
        $caption  = $structured['caption'];
        if ('' === $caption && isset($data['title'])) {
            $caption = sanitize_text_field($data['title']);
        }

        $avatar = isset($data['author_avatar_url']) ? esc_url_raw($data['author_avatar_url']) : '';
        if (!$this->isTrustedTikTokImageUrl($avatar)) {
            $avatar = '';
        }

        $thumbnail = isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '';
        if (!$this->isTrustedTikTokImageUrl($thumbnail)) {
            $thumbnail = '';
        }

        if ($video_id) {
            $thumbnail = TurboPress_Remote_Image_Cache::localize($thumbnail, 'tiktok', 'video:' . $video_id, 'cover');
            $avatar = TurboPress_Remote_Image_Cache::localize($avatar, 'tiktok', 'user:' . ($username ?: $video_id), 'avatar');
        }

        $canonical_url = $url;
        if ($username && $video_id) {
            $canonical_url = $this->getTikTokVideoUrl(array('username' => $username, 'id' => $video_id));
        }

        return array(
            'provider'   => 'tiktok',
            'url'        => esc_url_raw($canonical_url),
            'videoId'    => $video_id,
            'title'      => $caption,
            'caption'    => $caption,
            'thumbnail'  => $thumbnail,
            'authorName' => isset($data['author_name']) ? sanitize_text_field($data['author_name']) : '',
            'author'     => array(
                'username'    => $username,
                'displayName' => isset($data['author_name']) ? sanitize_text_field($data['author_name']) : '',
                'url'         => $username ? 'https://www.tiktok.com/@' . rawurlencode($username) : '',
                'avatar'      => $avatar,
                'verified'    => !empty($data['author_verified']),
            ),
            'hashtags'   => $structured['hashtags'],
            'music'      => $structured['music'],
            'embedHtml'  => $html,
        );
    }

    private function parseTikTokVideoUrl($url)
    {
        $parts = wp_parse_url(trim((string) $url));
        if (
            !is_array($parts) ||
            empty($parts['scheme']) ||
            'https' !== strtolower($parts['scheme']) ||
            empty($parts['host']) ||
            !in_array(strtolower($parts['host']), array('tiktok.com', 'www.tiktok.com'), true)
        ) {
            return null;
        }

        if (!preg_match('#^/@([A-Za-z0-9._]{2,24})/video/([0-9]{10,30})/?$#', $parts['path'] ?? '', $matches)) {
            return null;
        }

        return array('username' => $matches[1], 'id' => $matches[2]);
    }

    private function getTikTokVideoUrl($resource)
    {
        return 'https://www.tiktok.com/@' . rawurlencode($resource['username']) . '/video/' . $resource['id'];
    }

    private function parseTikTokEmbedHtml($html)
    {
        $result = array(
            'videoId'  => '',
            'username' => '',
            'caption'  => '',
            'hashtags' => array(),
            'music'    => array(),
        );
        if ('' === $html || !class_exists('DOMDocument')) {
            return $result;
        }

        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $loaded   = $document->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        if (!$loaded) {
            return $result;
        }

        $xpath      = new DOMXPath($document);
        $blockquote = $xpath->query('//blockquote[contains(concat(" ", normalize-space(@class), " "), " tiktok-embed ")]')->item(0);
        if (!$blockquote) {
            return $result;
        }

        $video_id = $blockquote->getAttribute('data-video-id');
        $result['videoId'] = preg_match('/^[0-9]{10,30}$/', $video_id) ? $video_id : '';
        $caption_parts = array();

        foreach ($xpath->query('.//section//a[@href]', $blockquote) as $anchor) {
            $href = html_entity_decode($anchor->getAttribute('href'), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $text = trim($anchor->textContent);
            $path = (string) wp_parse_url($href, PHP_URL_PATH);

            if (preg_match('#^/@([A-Za-z0-9._]{2,24})/?$#', $path, $matches)) {
                $result['username'] = $matches[1];
                continue;
            }
            if (preg_match('#^/tag/([A-Za-z0-9._-]{1,100})/?$#', $path, $matches)) {
                $name = ltrim($text, '#');
                $result['hashtags'][] = array(
                    'name' => sanitize_text_field($name ?: $matches[1]),
                    'url'  => 'https://www.tiktok.com/tag/' . rawurlencode(strtolower($matches[1])),
                );
                continue;
            }
            if (preg_match('#^/music/([A-Za-z0-9._~-]+)-([0-9]{10,30})/?$#', $path, $matches)) {
                $result['music'] = array(
                    'id'    => $matches[2],
                    'slug'  => $matches[1],
                    'title' => sanitize_text_field(preg_replace('/^\s*♬\s*/u', '', $text)),
                    'url'   => 'https://www.tiktok.com/music/' . $matches[1] . '-' . $matches[2],
                );
            }
        }

        foreach ($xpath->query('.//section//text()[not(ancestor::a)]', $blockquote) as $text_node) {
            $text = trim(preg_replace('/\s+/u', ' ', $text_node->nodeValue));
            if ('' !== $text) {
                $caption_parts[] = $text;
            }
        }
        $result['caption'] = sanitize_text_field(implode(' ', $caption_parts));

        return $result;
    }

    private function isTrustedTikTokImageUrl($url)
    {
        $parts = wp_parse_url($url);
        if (!is_array($parts) || 'https' !== strtolower($parts['scheme'] ?? '') || empty($parts['host'])) {
            return false;
        }

        $host = strtolower($parts['host']);
        foreach (array('tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokcdn-eu.com', 'muscdn.com', 'ibytedtos.com', 'byteimg.com', 'toscdn.com') as $suffix) {
            if ($host === $suffix || str_ends_with($host, '.' . $suffix)) {
                return true;
            }
        }

        return false;
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
            'thumbnail'  => TurboPress_Remote_Image_Cache::localize(
                isset($data['thumbnail_url']) ? esc_url_raw($data['thumbnail_url']) : '',
                'soundcloud', 'url:' . hash('sha256', $url), 'artwork'
            ),
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

new TurboPress();
