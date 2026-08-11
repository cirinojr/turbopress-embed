<?php

defined( 'ABSPATH' ) || exit;

/** Shared URL normalization, metadata retrieval, and SWR cache for next-generation providers. */
final class TurboPress_Nextgen_Providers {
	const CACHE_VERSION = '2';
	private const PROVIDERS = array( 'vimeo', 'gist', 'bluesky', 'twitch', 'smart-url', 'codepen', 'loom', 'figma' );

	public static function init() {
		foreach ( self::PROVIDERS as $provider ) {
			add_action( 'wp_ajax_tpe_get_' . str_replace( '-', '_', $provider ), array( __CLASS__, 'ajax' ) );
		}
		add_action( 'turbopress_nextgen_revalidate', array( __CLASS__, 'revalidate' ), 10, 2 );
	}

	public static function ajax() {
		check_ajax_referer( 'turbopress_embed_editor_nonce', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => __( 'You are not allowed to create embeds.', 'turbopress-embed' ) ), 403 );
		}
		$action = sanitize_key( $_POST['action'] ?? '' );
		$provider = str_replace( '_', '-', preg_replace( '/^tpe_get_/', '', $action ) );
		$url = esc_url_raw( wp_unslash( $_POST['url'] ?? '' ) );
		if ( ! in_array( $provider, self::PROVIDERS, true ) || ! $url ) {
			wp_send_json_error( array( 'message' => __( 'Use a valid provider URL.', 'turbopress-embed' ) ), 400 );
		}
		$result = self::get( $provider, $url );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ), 400 );
		}
		wp_send_json_success( $result );
	}

	public static function get( $provider, $url, $force = false ) {
		$resource = self::parse( $provider, $url );
		if ( is_wp_error( $resource ) ) return $resource;
		$key = 'tpe_nextgen_v' . self::CACHE_VERSION . '_' . $provider . '_' . hash( 'sha256', $resource['canonicalUrl'] );
		$entry = get_transient( $key );
		$now = time();
		if ( ! $force && is_array( $entry ) && ( $entry['fresh_until'] ?? 0 ) > $now ) return $entry['payload'];
		if ( ! $force && is_array( $entry ) && ( $entry['stale_until'] ?? 0 ) > $now ) {
			self::schedule( $key, $provider, $resource['canonicalUrl'] );
			return $entry['payload'];
		}
		$payload = self::fetch( $provider, $resource );
		if ( is_wp_error( $payload ) ) return is_array( $entry ) ? $entry['payload'] : $payload;
		self::store( $key, $provider, $payload );
		return $payload;
	}

	private static function store( $key, $provider, $payload ) {
		$ttl = 'smart-url' === $provider ? 2 * DAY_IN_SECONDS : 12 * HOUR_IN_SECONDS;
		set_transient( $key, array( 'payload' => $payload, 'fresh_until' => time() + $ttl, 'stale_until' => time() + 14 * DAY_IN_SECONDS ), 14 * DAY_IN_SECONDS );
	}

	private static function schedule( $key, $provider, $url ) {
		$lock = $key . '_lock';
		if ( ! get_transient( $lock ) ) {
			set_transient( $lock, 1, MINUTE_IN_SECONDS );
			wp_schedule_single_event( time(), 'turbopress_nextgen_revalidate', array( $provider, $url ) );
		}
	}

	public static function revalidate( $provider, $url ) {
		self::get( $provider, $url, true );
	}

	private static function parse( $provider, $url ) {
		$parts = wp_parse_url( trim( (string) $url ) );
		if ( ! is_array( $parts ) || 'https' !== strtolower( $parts['scheme'] ?? '' ) || empty( $parts['host'] ) ) return 'codepen' === $provider ? self::invalid_codepen() : self::invalid();
		$host = strtolower( $parts['host'] );
		$path = trim( $parts['path'] ?? '', '/' );
		if ( 'vimeo' === $provider && in_array( $host, array( 'vimeo.com', 'www.vimeo.com', 'player.vimeo.com' ), true ) && preg_match( '#^(?:video/)?([0-9]{6,12})$#', $path, $m ) ) {
			return array( 'provider' => 'vimeo', 'type' => 'video', 'id' => $m[1], 'canonicalUrl' => 'https://vimeo.com/' . $m[1], 'embedUrl' => 'https://player.vimeo.com/video/' . $m[1] );
		}
		if ( 'gist' === $provider && 'gist.github.com' === $host && preg_match( '#^([A-Za-z0-9-]+)/([a-f0-9]{5,40})(?:/.*)?$#i', $path, $m ) ) {
			return array( 'provider' => 'gist', 'type' => 'gist', 'id' => strtolower( $m[2] ), 'owner' => $m[1], 'canonicalUrl' => 'https://gist.github.com/' . rawurlencode( $m[1] ) . '/' . strtolower( $m[2] ) );
		}
		if ( 'bluesky' === $provider && in_array( $host, array( 'bsky.app', 'www.bsky.app' ), true ) && preg_match( '#^profile/([^/]+)/post/([A-Za-z0-9]+)$#', $path, $m ) ) {
			return array( 'provider' => 'bluesky', 'type' => 'post', 'id' => $m[2], 'actor' => sanitize_text_field( rawurldecode( $m[1] ) ), 'canonicalUrl' => 'https://bsky.app/profile/' . rawurlencode( rawurldecode( $m[1] ) ) . '/post/' . $m[2] );
		}
		if ( 'twitch' === $provider && in_array( $host, array( 'twitch.tv', 'www.twitch.tv', 'clips.twitch.tv' ), true ) ) return self::parse_twitch( $host, $path );
		if ( 'codepen' === $provider && in_array( $host, array( 'codepen.io', 'www.codepen.io' ), true ) && preg_match( '#^([A-Za-z0-9_-]{1,64})/(?:pen|embed)/([A-Za-z0-9_-]{1,128})$#', $path, $m ) ) {
			return array( 'provider' => 'codepen', 'type' => 'pen', 'id' => $m[2], 'owner' => $m[1], 'canonicalUrl' => 'https://codepen.io/' . rawurlencode( $m[1] ) . '/pen/' . $m[2], 'embedUrl' => 'https://codepen.io/' . rawurlencode( $m[1] ) . '/embed/' . $m[2] );
		}
		if ( 'loom' === $provider && in_array( $host, array( 'loom.com', 'www.loom.com' ), true ) && preg_match( '#^(?:share|embed)/([A-Za-z0-9]{20,64})$#', $path, $m ) ) {
			return array( 'provider' => 'loom', 'type' => 'video', 'id' => $m[1], 'canonicalUrl' => 'https://www.loom.com/share/' . $m[1], 'embedUrl' => 'https://www.loom.com/embed/' . $m[1] );
		}
		if ( 'figma' === $provider && in_array( $host, array( 'figma.com', 'www.figma.com' ), true ) && preg_match( '#^(file|design|proto|board)/([A-Za-z0-9_-]{10,128})(?:/[^?]*)?$#', $path, $m ) ) {
			$canonical = 'https://www.figma.com/' . $m[1] . '/' . $m[2];
			return array( 'provider' => 'figma', 'type' => $m[1], 'id' => $m[2], 'canonicalUrl' => $canonical, 'embedUrl' => 'https://www.figma.com/embed?embed_host=turbopress&url=' . rawurlencode( $canonical ) );
		}
		if ( 'smart-url' === $provider && self::safe_public_url( $url ) ) {
			return array( 'provider' => 'smart-url', 'type' => 'link', 'id' => hash( 'sha256', $url ), 'canonicalUrl' => esc_url_raw( $url ) );
		}
		return 'codepen' === $provider ? self::invalid_codepen() : self::invalid();
	}

	private static function parse_twitch( $host, $path ) {
		if ( 'clips.twitch.tv' === $host && preg_match( '#^([A-Za-z0-9_-]{3,100})$#', $path, $m ) ) $type = 'clip';
		elseif ( preg_match( '#^videos/([0-9]{3,20})$#', $path, $m ) ) $type = 'video';
		elseif ( preg_match( '#^([A-Za-z0-9_]{3,25})/clip/([A-Za-z0-9_-]{3,100})$#', $path, $m ) ) { $type = 'clip'; $m[1] = $m[2]; }
		elseif ( preg_match( '#^([A-Za-z0-9_]{3,25})$#', $path, $m ) ) $type = 'channel';
		else return self::invalid();
		$id = 'channel' === $type ? strtolower( $m[1] ) : $m[1];
		$canonical = 'clip' === $type ? 'https://clips.twitch.tv/' . $id : ( 'video' === $type ? 'https://www.twitch.tv/videos/' . $id : 'https://www.twitch.tv/' . $id );
		return array( 'provider' => 'twitch', 'type' => $type, 'id' => $id, 'canonicalUrl' => $canonical );
	}

	private static function fetch( $provider, $resource ) {
		if ( in_array( $provider, array( 'twitch', 'figma' ), true ) ) return self::normalize_static( $resource );
		if ( 'gist' === $provider ) return self::fetch_gist( $resource );
		if ( 'bluesky' === $provider ) return self::fetch_bluesky( $resource );
		if ( 'smart-url' === $provider ) return self::fetch_smart_url( $resource );
		$endpoints = array( 'vimeo' => 'https://vimeo.com/api/oembed.json', 'codepen' => 'https://codepen.io/api/oembed', 'loom' => 'https://www.loom.com/v1/oembed' );
		$args = 'codepen' === $provider ? array( 'url' => $resource['canonicalUrl'], 'format' => 'json' ) : array( 'url' => $resource['canonicalUrl'] );
		$data = self::fetch_json( add_query_arg( $args, $endpoints[ $provider ] ), array( 'redirection' => 2, 'limit_response_size' => MB_IN_BYTES ) );
		if ( is_wp_error( $data ) ) return 'codepen' === $provider ? self::normalize_static( $resource ) : $data;
		return array_merge( self::normalize_static( $resource ), array( 'title' => sanitize_text_field( $data['title'] ?? '' ), 'author' => sanitize_text_field( $data['author_name'] ?? '' ), 'thumbnail' => esc_url_raw( $data['thumbnail_url'] ?? '' ), 'description' => sanitize_textarea_field( $data['description'] ?? '' ) ) );
	}

	private static function normalize_static( $resource ) {
		if ( 'twitch' === $resource['provider'] ) {
			$parent = wp_parse_url( home_url( '/' ), PHP_URL_HOST );
			if ( 'clip' === $resource['type'] ) {
				$resource['embedUrl'] = add_query_arg( array( 'clip' => $resource['id'], 'parent' => $parent, 'autoplay' => 'true' ), 'https://clips.twitch.tv/embed' );
			} else {
				$parameter              = 'channel' === $resource['type'] ? 'channel' : 'video';
				$value                  = 'video' === $resource['type'] ? 'v' . $resource['id'] : $resource['id'];
				$resource['embedUrl'] = add_query_arg( array( 'parent' => $parent, 'autoplay' => 'true', $parameter => $value ), 'https://player.twitch.tv/' );
			}
		}
		return array_merge( $resource, array( 'title' => ucfirst( $resource['type'] ) . ' on ' . ucfirst( $resource['provider'] ), 'author' => $resource['owner'] ?? ( $resource['actor'] ?? ( 'channel' === $resource['type'] ? $resource['id'] : '' ) ), 'description' => '', 'thumbnail' => '' ) );
	}

	private static function fetch_gist( $resource ) {
		$data = self::fetch_json( 'https://api.github.com/gists/' . rawurlencode( $resource['id'] ), array( 'user-agent' => 'TurboPress-Embed', 'headers' => array( 'Accept' => 'application/vnd.github+json' ) ) );
		if ( is_wp_error( $data ) ) return $data;
		$files = array();
		foreach ( array_slice( $data['files'] ?? array(), 0, 20 ) as $file ) {
			$files[] = array( 'name' => sanitize_file_name( $file['filename'] ?? '' ), 'language' => sanitize_text_field( $file['language'] ?? '' ), 'content' => substr( (string) ( $file['content'] ?? '' ), 0, 200000 ) );
		}
		if ( ! $files ) return self::unavailable();
		return array_merge( self::normalize_static( $resource ), array( 'title' => sanitize_text_field( $data['description'] ?? '' ) ?: $files[0]['name'], 'description' => sanitize_textarea_field( $data['description'] ?? '' ), 'files' => $files ) );
	}

	private static function fetch_bluesky( $resource ) {
		$uri = 'at://' . $resource['actor'] . '/app.bsky.feed.post/' . $resource['id'];
		$data = self::fetch_json( add_query_arg( array( 'uri' => $uri, 'depth' => 0 ), 'https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread' ) );
		if ( is_wp_error( $data ) ) return $data;
		$post = $data['thread']['post'] ?? array(); $record = $post['record'] ?? array(); $author = $post['author'] ?? array();
		if ( empty( $record['text'] ) ) return self::unavailable();
		$images = $post['embed']['images'] ?? array();
		return array_merge( self::normalize_static( $resource ), array( 'title' => sanitize_text_field( $author['displayName'] ?? $resource['actor'] ), 'author' => sanitize_text_field( $author['handle'] ?? $resource['actor'] ), 'avatar' => esc_url_raw( $author['avatar'] ?? '' ), 'text' => sanitize_textarea_field( $record['text'] ), 'createdAt' => sanitize_text_field( $record['createdAt'] ?? '' ), 'thumbnail' => esc_url_raw( $images[0]['thumb'] ?? '' ) ) );
	}

	private static function fetch_smart_url( $resource ) {
		$response = self::safe_get( $resource['canonicalUrl'] );
		if ( is_wp_error( $response ) ) return $response;
		$html = wp_remote_retrieve_body( $response );
		if ( ! class_exists( 'DOMDocument' ) || '' === $html ) return self::unavailable();
		$doc = new DOMDocument(); $old = libxml_use_internal_errors( true ); $loaded = $doc->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING ); libxml_clear_errors(); libxml_use_internal_errors( $old );
		if ( ! $loaded ) return self::unavailable();
		$xpath = new DOMXPath( $doc );
		$meta = static function( $names ) use ( $xpath ) { foreach ( $names as $name ) { $nodes = $xpath->query( '//meta[@property="' . $name . '" or @name="' . $name . '"]/@content' ); if ( $nodes->length ) return trim( $nodes->item( 0 )->nodeValue ); } return ''; };
		$title = $meta( array( 'og:title', 'twitter:title' ) ); if ( ! $title ) { $nodes = $xpath->query( '//title' ); $title = $nodes->length ? $nodes->item( 0 )->textContent : ''; }
		$canonical = $resource['canonicalUrl']; $nodes = $xpath->query( '//link[@rel="canonical"]/@href' ); if ( $nodes->length ) { $candidate = self::absolute_url( $nodes->item( 0 )->nodeValue, $canonical ); if ( self::safe_public_url( $candidate ) ) $canonical = $candidate; }
		$host = wp_parse_url( $canonical, PHP_URL_HOST );
		$image = self::absolute_url( $meta( array( 'og:image', 'twitter:image' ) ), $canonical );
		$icon = self::absolute_url( self::icon_href( $xpath ), $canonical );
		return array_merge( self::normalize_static( $resource ), array( 'canonicalUrl' => esc_url_raw( $canonical ), 'title' => sanitize_text_field( $title ), 'description' => sanitize_textarea_field( $meta( array( 'og:description', 'twitter:description', 'description' ) ) ), 'thumbnail' => self::safe_public_url( $image ) ? esc_url_raw( $image ) : '', 'siteName' => sanitize_text_field( $meta( array( 'og:site_name' ) ) ?: $host ), 'favicon' => self::safe_public_url( $icon ) ? esc_url_raw( $icon ) : '' ) );
	}

	private static function safe_get( $url ) {
		for ( $i = 0; $i < 3; $i++ ) {
			if ( ! self::safe_public_url( $url ) ) return self::invalid();
			$response = wp_safe_remote_get( $url, array( 'timeout' => 10, 'redirection' => 0, 'limit_response_size' => 2 * MB_IN_BYTES, 'user-agent' => 'TurboPress Embed/1.0' ) );
			if ( is_wp_error( $response ) ) return self::unavailable();
			$status = wp_remote_retrieve_response_code( $response );
			if ( $status >= 300 && $status < 400 ) { $url = self::absolute_url( wp_remote_retrieve_header( $response, 'location' ), $url ); continue; }
			return 200 === $status ? $response : self::unavailable();
		}
		return self::unavailable();
	}

	private static function fetch_json( $url, $args = array() ) {
		$response = wp_safe_remote_get(
			$url,
			array_replace(
				array(
					'timeout'             => 10,
					'redirection'         => 0,
					'limit_response_size' => 2 * MB_IN_BYTES,
					'user-agent'          => 'TurboPress Embed/1.0',
				),
				$args
			)
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) return self::unavailable();
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		return is_array( $data ) ? $data : self::unavailable();
	}

	private static function safe_public_url( $url ) {
		if ( ! wp_http_validate_url( $url ) ) return false;
		$host = strtolower( wp_parse_url( $url, PHP_URL_HOST ) );
		if ( ! $host || 'localhost' === $host || str_ends_with( $host, '.local' ) ) return false;
		$ips = array(); if ( filter_var( $host, FILTER_VALIDATE_IP ) ) $ips[] = $host; else { $records = function_exists( 'dns_get_record' ) ? dns_get_record( $host, DNS_A | DNS_AAAA ) : array(); foreach ( $records ?: array() as $record ) { if ( ! empty( $record['ip'] ) ) $ips[] = $record['ip']; if ( ! empty( $record['ipv6'] ) ) $ips[] = $record['ipv6']; } }
		if ( ! $ips ) return false;
		foreach ( $ips as $ip ) if ( ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) return false;
		return true;
	}

	private static function absolute_url( $candidate, $base ) {
		$candidate = trim( html_entity_decode( (string) $candidate, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ); if ( ! $candidate ) return '';
		if ( preg_match( '#^https://#i', $candidate ) ) return $candidate;
		$parts = wp_parse_url( $base ); if ( str_starts_with( $candidate, '//' ) ) return 'https:' . $candidate;
		return 'https://' . $parts['host'] . ( str_starts_with( $candidate, '/' ) ? $candidate : '/' . $candidate );
	}

	private static function icon_href( $xpath ) { $nodes = $xpath->query( '//link[contains(concat(" ", normalize-space(@rel), " "), " icon ")]/@href' ); return $nodes->length ? $nodes->item( 0 )->nodeValue : ''; }
	private static function invalid() { return new WP_Error( 'tpe_invalid_url', __( 'Use a valid public provider URL.', 'turbopress-embed' ) ); }
	private static function invalid_codepen() { return new WP_Error( 'tpe_invalid_url', __( 'Invalid CodePen Pen URL. Expected format: https://codepen.io/username/pen/slug', 'turbopress-embed' ) ); }
	private static function unavailable() { return new WP_Error( 'tpe_provider_unavailable', __( 'Metadata is temporarily unavailable.', 'turbopress-embed' ) ); }
}
