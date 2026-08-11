<?php

defined( 'ABSPATH' ) || exit;

/** Shared GitHub provider, SWR cache, and REST API for portfolio blocks. */
class TurboPress_Remote_Data {
	const REST_NAMESPACE = 'turbopress-embed/v1';
	const CACHE_GROUP    = 'turbopress_embed';
	const YOUTUBE_CACHE_VERSION = '3';

	private static $memo = array();

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'turbopress_embed_revalidate', array( __CLASS__, 'revalidate' ), 10, 3 );
		add_action( 'turbopress_embed_revalidate_youtube', array( __CLASS__, 'revalidate_youtube' ) );
	}

	public static function get_youtube_metadata( $url, $force = false ) {
		$video_id = self::parse_youtube_video_id( $url );
		if ( is_wp_error( $video_id ) ) {
			return $video_id;
		}

		$key = 'turbopress_youtube_v' . self::YOUTUBE_CACHE_VERSION . '_video_' . hash( 'sha256', $video_id );
		if ( ! $force && isset( self::$memo[ $key ] ) ) {
			return self::$memo[ $key ]['payload'];
		}
		$entry = wp_cache_get( $key, self::CACHE_GROUP );
		if ( false === $entry ) {
			$entry = get_transient( $key );
		}
		$now = time();
		if ( ! $force && is_array( $entry ) && $entry['revalidate_at'] > $now ) {
			self::$memo[ $key ] = array( 'payload' => $entry['payload'] );
			do_action( 'turbopress_embed_cache_event', 'server_cache_hit', $key, array() );
			return $entry['payload'];
		}
		if ( ! $force && is_array( $entry ) && $entry['stale_until'] > $now ) {
			self::schedule_youtube_revalidation( $key, $video_id );
			self::$memo[ $key ] = array( 'payload' => $entry['payload'] );
			do_action( 'turbopress_embed_cache_event', 'server_cache_stale', $key, array() );
			return $entry['payload'];
		}

		$updated = self::fetch_youtube( $video_id, $entry );
		if ( is_wp_error( $updated ) ) {
			return is_array( $entry ) ? $entry['payload'] : $updated;
		}
		self::store( $key, $updated );
		self::$memo[ $key ] = array( 'payload' => $updated['payload'] );
		return $updated['payload'];
	}

	private static function parse_youtube_video_id( $url ) {
		$value = trim( (string) $url );
		if ( preg_match( '/^[A-Za-z0-9_-]{11}$/', $value ) ) {
			return $value;
		}
		$parts = wp_parse_url( $value );
		if ( empty( $parts['scheme'] ) || 'https' !== strtolower( $parts['scheme'] ) || empty( $parts['host'] ) ) {
			return new WP_Error( 'turbopress_invalid_youtube_url', __( 'Use a valid YouTube video URL.', 'turbopress-embed' ) );
		}
		$host = strtolower( $parts['host'] );
		$id   = '';
		if ( 'youtu.be' === $host || str_ends_with( $host, '.youtu.be' ) ) {
			$id = trim( $parts['path'] ?? '', '/' );
		} elseif ( 'youtube.com' === $host || str_ends_with( $host, '.youtube.com' ) ) {
			$path = trim( $parts['path'] ?? '', '/' );
			if ( 'watch' === $path ) {
				parse_str( $parts['query'] ?? '', $query );
				$id = $query['v'] ?? '';
			} elseif ( preg_match( '#^(?:shorts|embed)/([^/]+)#', $path, $matches ) ) {
				$id = $matches[1];
			}
		}
		return preg_match( '/^[A-Za-z0-9_-]{11}$/', $id ) ? $id : new WP_Error( 'turbopress_invalid_youtube_url', __( 'Use a valid YouTube video URL.', 'turbopress-embed' ) );
	}

	private static function youtube_ttl() {
		return (int) apply_filters( 'turbopress_embed_cache_ttl', 6 * HOUR_IN_SECONDS, 'youtube', 'video' );
	}

	private static function schedule_youtube_revalidation( $key, $video_id ) {
		$lock = $key . '_lock';
		$locked_at = (int) get_option( $lock, 0 );
		if ( $locked_at && $locked_at < time() - MINUTE_IN_SECONDS ) {
			delete_option( $lock );
		}
		if ( add_option( $lock, time(), '', false ) ) {
			wp_schedule_single_event( time(), 'turbopress_embed_revalidate_youtube', array( $video_id ) );
		}
	}

	public static function revalidate_youtube( $video_id ) {
		if ( ! preg_match( '/^[A-Za-z0-9_-]{11}$/', (string) $video_id ) ) {
			return;
		}
		$key = 'turbopress_youtube_v' . self::YOUTUBE_CACHE_VERSION . '_video_' . hash( 'sha256', $video_id );
		$entry = get_transient( $key );
		$result = self::fetch_youtube( $video_id, $entry );
		if ( ! is_wp_error( $result ) ) {
			self::store( $key, $result );
		}
		delete_option( $key . '_lock' );
	}

	private static function fetch_youtube( $video_id, $previous ) {
		$url = 'https://www.youtube.com/watch?v=' . rawurlencode( $video_id ) . '&hl=en';
		$headers = array( 'Accept-Language' => 'en-US,en;q=0.8', 'User-Agent' => 'TurboPress-Embed' );
		if ( is_array( $previous ) && ! empty( $previous['etag'] ) ) {
			$headers['If-None-Match'] = $previous['etag'];
		}
		if ( is_array( $previous ) && ! empty( $previous['last_modified'] ) ) {
			$headers['If-Modified-Since'] = $previous['last_modified'];
		}
		$response = wp_safe_remote_get( $url, array( 'headers' => $headers, 'timeout' => 12, 'redirection' => 2, 'limit_response_size' => 2 * MB_IN_BYTES ) );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$status = wp_remote_retrieve_response_code( $response );
		$ttl = self::youtube_ttl();
		if ( 304 === $status && is_array( $previous ) ) {
			$previous['checked_at'] = time();
			$previous['revalidate_at'] = time() + $ttl;
			$previous['stale_until'] = time() + 7 * DAY_IN_SECONDS;
			return $previous;
		}
		if ( 200 !== $status ) {
			return new WP_Error( 'turbopress_youtube_unavailable', __( 'Unable to load YouTube metadata.', 'turbopress-embed' ) );
		}
		$payload = self::extract_youtube_metadata( wp_remote_retrieve_body( $response ), $video_id );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}
		$fingerprint_payload = $payload;
		unset( $fingerprint_payload['fetchedAt'] );
		$fingerprint = hash( 'sha256', wp_json_encode( $fingerprint_payload ) );
		return array(
			'payload' => $payload,
			'fingerprint' => $fingerprint,
			'etag' => wp_remote_retrieve_header( $response, 'etag' ),
			'last_modified' => wp_remote_retrieve_header( $response, 'last-modified' ),
			'updated_at' => time(),
			'checked_at' => time(),
			'revalidate_at' => time() + $ttl,
			'stale_until' => time() + 7 * DAY_IN_SECONDS,
			'changed' => ! is_array( $previous ) || $fingerprint !== ( $previous['fingerprint'] ?? '' ),
		);
	}

	private static function extract_youtube_metadata( $html, $video_id ) {
		if ( '' === trim( (string) $html ) || ! class_exists( 'DOMDocument' ) ) {
			return new WP_Error( 'turbopress_youtube_parse_error', __( 'Unable to load YouTube metadata.', 'turbopress-embed' ) );
		}
		$document = new DOMDocument();
		$previous = libxml_use_internal_errors( true );
		$loaded = $document->loadHTML( '<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING );
		libxml_clear_errors();
		libxml_use_internal_errors( $previous );
		if ( ! $loaded ) {
			return new WP_Error( 'turbopress_youtube_parse_error', __( 'Unable to load YouTube metadata.', 'turbopress-embed' ) );
		}
		$xpath = new DOMXPath( $document );
		$read = static function( $query, $attribute ) use ( $xpath ) {
			$nodes = $xpath->query( $query );
			return $nodes && $nodes->length ? trim( $nodes->item( 0 )->getAttribute( $attribute ) ) : '';
		};
		$player = self::decode_youtube_json( $html, 'var ytInitialPlayerResponse =' );
		if ( ! $player ) {
			$player = self::decode_youtube_json( $html, '"ytInitialPlayerResponse":' );
		}
		$initial = self::decode_youtube_json( $html, 'var ytInitialData =' );
		if ( ! $initial ) {
			$initial = self::decode_youtube_json( $html, '"ytInitialData":' );
		}
		$details = $player['videoDetails'] ?? array();
		$micro = $player['microformat']['playerMicroformatRenderer'] ?? array();
		$playability = $player['playabilityStatus'] ?? array();
		$renderers = self::youtube_watch_renderers( $initial );
		$primary = $renderers['primary'];
		$owner = $renderers['owner'];
		$og_title = $read( '//meta[@property="og:title"]', 'content' ) ?: $read( '//meta[@name="title"]', 'content' );
		$og_thumbnail = $read( '//meta[@property="og:image"]', 'content' );
		$og_canonical = $read( '//link[@rel="canonical"]', 'href' );
		$title = $details['title'] ?? ( self::youtube_text( $micro['title'] ?? array() ) ?: $og_title );
		$thumbnail = self::select_youtube_video_thumbnail( $details['thumbnail']['thumbnails'] ?? array() );
		if ( ! $thumbnail ) {
			$thumbnail = self::select_youtube_video_thumbnail( $micro['thumbnail']['thumbnails'] ?? array() );
		}
		if ( ! $thumbnail ) {
			$thumbnail = $og_thumbnail;
		}
		$canonical = $micro['canonicalUrl'] ?? $og_canonical;
		$channel = self::extract_youtube_channel( $initial, $owner, $details, $micro, $xpath );
		$title = sanitize_text_field( html_entity_decode( $title, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( ! $title ) {
			return new WP_Error( 'turbopress_youtube_parse_error', __( 'Unable to load YouTube metadata.', 'turbopress-embed' ) );
		}
		$thumbnail_host = strtolower( (string) wp_parse_url( $thumbnail, PHP_URL_HOST ) );
		if ( 'ytimg.com' !== $thumbnail_host && ! str_ends_with( $thumbnail_host, '.ytimg.com' ) ) {
			$thumbnail = 'https://i.ytimg.com/vi/' . $video_id . '/hqdefault.jpg';
		}
		$canonical_id = self::parse_youtube_video_id( $canonical );
		if ( is_wp_error( $canonical_id ) || $canonical_id !== $video_id ) {
			$canonical = 'https://www.youtube.com/watch?v=' . $video_id;
		}
		$view_renderer = $primary['viewCount']['videoViewCountRenderer'] ?? array();
		$duration = absint( $details['lengthSeconds'] ?? 0 );
		$playable_in_embed = ! array_key_exists( 'playableInEmbed', $playability ) || (bool) $playability['playableInEmbed'];
		$video = array(
			'id' => preg_match( '/^[A-Za-z0-9_-]{11}$/', $details['videoId'] ?? '' ) ? $details['videoId'] : $video_id,
			'title' => $title,
			'description' => sanitize_textarea_field( $details['shortDescription'] ?? '' ),
			'thumbnail' => esc_url_raw( $thumbnail ),
			'durationSeconds' => $duration,
			'durationText' => self::format_youtube_duration( $duration ),
			'viewCount' => absint( $details['viewCount'] ?? 0 ),
			'viewCountText' => sanitize_text_field( self::youtube_text( $view_renderer['viewCount'] ?? array() ) ),
			'shortViewCountText' => sanitize_text_field( self::youtube_text( $view_renderer['shortViewCount'] ?? array() ) ),
			'likeCount' => absint( $micro['likeCount'] ?? 0 ),
			'publishDate' => sanitize_text_field( $micro['publishDate'] ?? '' ),
			'uploadDate' => sanitize_text_field( $micro['uploadDate'] ?? '' ),
			'dateText' => sanitize_text_field( self::youtube_text( $primary['dateText'] ?? array() ) ),
			'relativeDateText' => sanitize_text_field( self::youtube_text( $primary['relativeDateText'] ?? array() ) ),
			'canonicalUrl' => esc_url_raw( $canonical ),
			'embedUrl' => 'https://www.youtube-nocookie.com/embed/' . $video_id,
			'category' => sanitize_text_field( $micro['category'] ?? '' ),
			'isLive' => ! empty( $details['isLiveContent'] ),
			'isPrivate' => ! empty( $details['isPrivate'] ),
			'playabilityStatus' => sanitize_text_field( $playability['status'] ?? '' ),
			'playableInEmbed' => $playable_in_embed,
			'channelId' => $channel['id'] ?? '',
		);
		return array(
			'provider' => 'youtube',
			'videoId' => $video['id'],
			'title' => $title,
			'thumbnail' => $video['thumbnail'],
			'video' => $video,
			'channel' => $channel,
			'canonicalUrl' => $video['canonicalUrl'],
			'fetchedAt' => time(),
		);
	}

	private static function extract_youtube_channel( $initial, $owner, $details, $micro, $xpath ) {
		$name = self::youtube_text( $owner['title'] ?? array() );
		if ( ! $name ) {
			$name = $details['author'] ?? ( $micro['ownerChannelName'] ?? '' );
		}
		if ( ! $name ) {
			$nodes = $xpath->query( '//*[@itemprop="author"]//link[@itemprop="name"]' );
			$name = $nodes && $nodes->length ? $nodes->item( 0 )->getAttribute( 'content' ) : '';
		}
		$name = sanitize_text_field( html_entity_decode( (string) $name, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( ! $name ) {
			return array();
		}

		$endpoint = $owner['navigationEndpoint']['browseEndpoint'] ?? array();
		if ( empty( $endpoint ) && ! empty( $owner['title']['runs'][0]['navigationEndpoint']['browseEndpoint'] ) ) {
			$endpoint = $owner['title']['runs'][0]['navigationEndpoint']['browseEndpoint'];
		}
		$channel_id = $endpoint['browseId'] ?? ( $details['channelId'] ?? ( $micro['externalChannelId'] ?? '' ) );
		$channel_id = preg_match( '/^UC[A-Za-z0-9_-]{22}$/', (string) $channel_id ) ? $channel_id : '';

		$channel_path = $endpoint['canonicalBaseUrl'] ?? '';
		if ( ! $channel_path && ! empty( $owner['navigationEndpoint']['commandMetadata']['webCommandMetadata']['url'] ) ) {
			$channel_path = $owner['navigationEndpoint']['commandMetadata']['webCommandMetadata']['url'];
		}
		$channel_url = $channel_path ? 'https://www.youtube.com/' . ltrim( $channel_path, '/' ) : ( $micro['ownerProfileUrl'] ?? '' );
		if ( ! self::is_valid_youtube_channel_url( $channel_url ) && $channel_id ) {
			$channel_url = 'https://www.youtube.com/channel/' . $channel_id;
		}
		if ( ! self::is_valid_youtube_channel_url( $channel_url ) ) {
			$channel_url = '';
		}

		$thumbnails = $owner['thumbnail']['thumbnails'] ?? array();
		if ( empty( $thumbnails ) ) {
			$description = self::find_youtube_renderer( $initial, 'videoDescriptionHeaderRenderer' );
			$description_id = $description['channelNavigationEndpoint']['browseEndpoint']['browseId'] ?? '';
			if ( $channel_id && hash_equals( $channel_id, (string) $description_id ) ) {
				$thumbnails = $description['channelThumbnail']['thumbnails'] ?? array();
			}
		}
		$avatar = self::select_youtube_avatar( $thumbnails );
		$subscriber_text = self::youtube_text( $owner['subscriberCountText'] ?? array() );
		if ( ! $subscriber_text && ! empty( $owner['subscriberCountText']['accessibility']['accessibilityData']['label'] ) ) {
			$subscriber_text = $owner['subscriberCountText']['accessibility']['accessibilityData']['label'];
		}
		$verified = false;
		foreach ( $owner['badges'] ?? array() as $badge ) {
			$renderer = $badge['metadataBadgeRenderer'] ?? array();
			$badge_style = $renderer['style'] ?? '';
			$icon_type = $renderer['icon']['iconType'] ?? '';
			if ( str_starts_with( $badge_style, 'BADGE_STYLE_TYPE_VERIFIED' ) || in_array( $icon_type, array( 'CHECK_CIRCLE_THICK', 'OFFICIAL_ARTIST_BADGE' ), true ) ) {
				$verified = true;
				break;
			}
		}

		return array(
			'name' => $name,
			'id' => $channel_id,
			'url' => esc_url_raw( $channel_url ),
			'thumbnail' => esc_url_raw( $avatar ),
			'subscriberText' => sanitize_text_field( $subscriber_text ),
			'verified' => $verified,
		);
	}

	private static function youtube_watch_renderers( $initial ) {
		$contents = $initial['contents']['twoColumnWatchNextResults']['results']['results']['contents'] ?? array();
		$owner = array();
		$primary = array();
		foreach ( is_array( $contents ) ? $contents : array() as $item ) {
			if ( ! $owner && ! empty( $item['videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer'] ) ) {
				$owner = $item['videoSecondaryInfoRenderer']['owner']['videoOwnerRenderer'];
			}
			if ( ! $primary && ! empty( $item['videoPrimaryInfoRenderer'] ) ) {
				$primary = $item['videoPrimaryInfoRenderer'];
			}
		}
		return array( 'owner' => $owner, 'primary' => $primary );
	}

	private static function decode_youtube_json( $html, $marker ) {
		$marker_position = strpos( $html, $marker );
		if ( false === $marker_position ) {
			return array();
		}
		$start = strpos( $html, '{', $marker_position + strlen( $marker ) );
		if ( false === $start ) {
			return array();
		}
		$depth = 0;
		$in_string = false;
		$escaped = false;
		$length = strlen( $html );
		for ( $index = $start; $index < $length; $index++ ) {
			$character = $html[ $index ];
			if ( $in_string ) {
				if ( $escaped ) {
					$escaped = false;
				} elseif ( '\\' === $character ) {
					$escaped = true;
				} elseif ( '"' === $character ) {
					$in_string = false;
				}
				continue;
			}
			if ( '"' === $character ) {
				$in_string = true;
			} elseif ( '{' === $character ) {
				$depth++;
			} elseif ( '}' === $character && 0 === --$depth ) {
				$decoded = json_decode( substr( $html, $start, $index - $start + 1 ), true );
				return is_array( $decoded ) ? $decoded : array();
			}
		}
		return array();
	}

	private static function find_youtube_renderer( $data, $key ) {
		if ( ! is_array( $data ) ) {
			return array();
		}
		if ( isset( $data[ $key ] ) && is_array( $data[ $key ] ) ) {
			return $data[ $key ];
		}
		foreach ( $data as $value ) {
			$found = self::find_youtube_renderer( $value, $key );
			if ( $found ) {
				return $found;
			}
		}
		return array();
	}

	private static function youtube_text( $value ) {
		if ( ! empty( $value['simpleText'] ) ) {
			return $value['simpleText'];
		}
		if ( ! empty( $value['runs'] ) && is_array( $value['runs'] ) ) {
			return implode( '', array_map( static function( $run ) { return $run['text'] ?? ''; }, $value['runs'] ) );
		}
		return '';
	}

	private static function select_youtube_video_thumbnail( $thumbnails ) {
		$candidates = array();
		foreach ( is_array( $thumbnails ) ? $thumbnails : array() as $thumbnail ) {
			$url = $thumbnail['url'] ?? '';
			$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
			if ( 'ytimg.com' === $host || str_ends_with( $host, '.ytimg.com' ) ) {
				$candidates[] = array(
					'url' => $url,
					'area' => absint( $thumbnail['width'] ?? 0 ) * absint( $thumbnail['height'] ?? 0 ),
				);
			}
		}
		usort( $candidates, static function( $left, $right ) { return $right['area'] <=> $left['area']; } );
		return $candidates[0]['url'] ?? '';
	}

	private static function format_youtube_duration( $seconds ) {
		$seconds = absint( $seconds );
		$hours = (int) floor( $seconds / 3600 );
		$minutes = (int) floor( ( $seconds % 3600 ) / 60 );
		$remaining = $seconds % 60;
		return $hours ? sprintf( '%d:%02d:%02d', $hours, $minutes, $remaining ) : sprintf( '%d:%02d', $minutes, $remaining );
	}

	private static function select_youtube_avatar( $thumbnails ) {
		$candidates = array();
		foreach ( is_array( $thumbnails ) ? $thumbnails : array() as $thumbnail ) {
			$url = $thumbnail['url'] ?? '';
			$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
			if ( 'ggpht.com' === $host || str_ends_with( $host, '.ggpht.com' ) || 'googleusercontent.com' === $host || str_ends_with( $host, '.googleusercontent.com' ) ) {
				$candidates[] = array( 'url' => $url, 'width' => absint( $thumbnail['width'] ?? 0 ) );
			}
		}
		$adequate = array_values( array_filter( $candidates, static function( $candidate ) { return $candidate['width'] >= 88; } ) );
		if ( $adequate ) {
			usort( $adequate, static function( $left, $right ) { return $left['width'] <=> $right['width']; } );
			return $adequate[0]['url'];
		}
		usort( $candidates, static function( $left, $right ) { return $right['width'] <=> $left['width']; } );
		return $candidates[0]['url'] ?? '';
	}

	private static function is_valid_youtube_channel_url( $url ) {
		$parts = wp_parse_url( $url );
		if ( empty( $parts['scheme'] ) || 'https' !== strtolower( $parts['scheme'] ) || empty( $parts['host'] ) ) {
			return false;
		}
		$host = strtolower( $parts['host'] );
		return ( 'youtube.com' === $host || str_ends_with( $host, '.youtube.com' ) ) && preg_match( '#^/(?:channel/UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9._-]+|c/[A-Za-z0-9._-]+|user/[A-Za-z0-9._-]+)/?$#', $parts['path'] ?? '' );
	}

	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/github/(?P<resource>repository|languages|file)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'rest_response' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'url'      => array( 'required' => true, 'sanitize_callback' => 'esc_url_raw' ),
					'branch'   => array( 'sanitize_callback' => 'sanitize_text_field' ),
					'path'     => array( 'sanitize_callback' => 'sanitize_text_field' ),
					'refresh'  => array( 'sanitize_callback' => 'rest_sanitize_boolean' ),
				),
			)
		);
	}

	public static function rest_response( WP_REST_Request $request ) {
		$repository = self::parse_repository_url( $request['url'] );
		if ( is_wp_error( $repository ) ) {
			return $repository;
		}

		$resource = $request['resource'];
		$options  = array(
			'branch' => self::validate_ref( $request->get_param( 'branch' ) ),
			'path'   => self::validate_path( $request->get_param( 'path' ) ),
		);
		if ( 'file' === $resource && ( is_wp_error( $options['branch'] ) || is_wp_error( $options['path'] ) ) ) {
			return new WP_Error( 'turbopress_invalid_file', __( 'Invalid branch or file path.', 'turbopress-embed' ), array( 'status' => 400 ) );
		}

		$force = rest_sanitize_boolean( $request->get_param( 'refresh' ) );
		if ( $force && ! current_user_can( 'edit_posts' ) ) {
			$force = false;
		}

		$result = self::get( $resource, $repository, $options, $force );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = new WP_REST_Response( $result['payload'], 200 );
		$response->header( 'ETag', '"' . $result['fingerprint'] . '"' );
		$response->header( 'X-TurboPress-Cache', $result['status'] );
		$response->header( 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300' );
		$client_etag = trim( (string) $request->get_header( 'if-none-match' ), '" ' );
		if ( $client_etag && hash_equals( $result['fingerprint'], $client_etag ) ) {
			$response->set_status( 304 );
			$response->set_data( null );
		}
		return $response;
	}

	public static function parse_repository_url( $url ) {
		$parts = wp_parse_url( trim( (string) $url ) );
		if ( empty( $parts['scheme'] ) || 'https' !== strtolower( $parts['scheme'] ) || empty( $parts['host'] ) || 'github.com' !== strtolower( $parts['host'] ) ) {
			return new WP_Error( 'turbopress_invalid_repository', __( 'Enter a valid GitHub repository URL.', 'turbopress-embed' ), array( 'status' => 400 ) );
		}
		$segments = array_values( array_filter( explode( '/', trim( $parts['path'], '/' ) ) ) );
		if ( 2 !== count( $segments ) ) {
			return new WP_Error( 'turbopress_invalid_repository', __( 'The URL must identify one GitHub repository.', 'turbopress-embed' ), array( 'status' => 400 ) );
		}
		$owner = $segments[0];
		$repo  = preg_replace( '/\.git$/i', '', $segments[1] );
		if ( ! preg_match( '/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/', $owner ) || ! preg_match( '/^[A-Za-z0-9_.-]{1,100}$/', $repo ) ) {
			return new WP_Error( 'turbopress_invalid_repository', __( 'Invalid GitHub owner or repository.', 'turbopress-embed' ), array( 'status' => 400 ) );
		}
		return array( 'owner' => $owner, 'repository' => $repo );
	}

	private static function validate_ref( $ref ) {
		$ref = trim( (string) $ref );
		if ( '' === $ref ) {
			return '';
		}
		return preg_match( '/^[A-Za-z0-9._\/-]{1,200}$/', $ref ) && false === strpos( $ref, '..' ) ? $ref : new WP_Error( 'invalid_ref' );
	}

	private static function validate_path( $path ) {
		$path = ltrim( str_replace( '\\', '/', trim( (string) $path ) ), '/' );
		return $path && strlen( $path ) <= 500 && false === strpos( $path, '..' ) && preg_match( '/^[A-Za-z0-9._\/@+ -]+$/', $path ) ? $path : new WP_Error( 'invalid_path' );
	}

	private static function get( $resource, $repository, $options, $force = false ) {
		$key = self::cache_key( $resource, $repository, $options );
		if ( ! $force && isset( self::$memo[ $key ] ) ) {
			return self::$memo[ $key ];
		}

		$entry = wp_cache_get( $key, self::CACHE_GROUP );
		if ( false === $entry ) {
			$entry = get_transient( $key );
		}
		$now = time();
		if ( ! $force && is_array( $entry ) && $entry['revalidate_at'] > $now ) {
			return self::remember( $key, $entry, 'HIT' );
		}
		if ( ! $force && is_array( $entry ) && $entry['stale_until'] > $now ) {
			self::schedule_revalidation( $key, $resource, $repository, $options );
			return self::remember( $key, $entry, 'STALE' );
		}

		$updated = self::fetch( $resource, $repository, $options, $entry );
		if ( is_wp_error( $updated ) ) {
			if ( is_array( $entry ) ) {
				do_action( 'turbopress_embed_cache_event', 'provider_error', $key, array( 'code' => $updated->get_error_code() ) );
				return self::remember( $key, $entry, 'STALE' );
			}
			return $updated;
		}
		self::store( $key, $updated );
		return self::remember( $key, $updated, empty( $entry ) ? 'MISS' : ( $updated['changed'] ? 'UPDATED' : 'REVALIDATED' ) );
	}

	private static function remember( $key, $entry, $status ) {
		$result = array( 'payload' => $entry['payload'], 'fingerprint' => $entry['fingerprint'], 'status' => $status );
		self::$memo[ $key ] = $result;
		do_action( 'turbopress_embed_cache_event', strtolower( $status ), $key, array() );
		return $result;
	}

	private static function cache_key( $resource, $repository, $options ) {
		$identity = wp_json_encode( array( $repository, $options ) );
		return 'turbopress_github_' . $resource . '_' . substr( hash( 'sha256', $identity ), 0, 32 );
	}

	private static function ttl( $resource ) {
		$defaults = array( 'repository' => 6 * HOUR_IN_SECONDS, 'languages' => DAY_IN_SECONDS, 'file' => DAY_IN_SECONDS );
		return (int) apply_filters( 'turbopress_embed_cache_ttl', $defaults[ $resource ], 'github', $resource );
	}

	private static function store( $key, $entry ) {
		$expiration = max( HOUR_IN_SECONDS, $entry['stale_until'] - time() );
		set_transient( $key, $entry, $expiration );
		wp_cache_set( $key, $entry, self::CACHE_GROUP, $expiration );
	}

	private static function schedule_revalidation( $key, $resource, $repository, $options ) {
		$lock = $key . '_lock';
		$locked_at = (int) get_option( $lock, 0 );
		if ( $locked_at && $locked_at < time() - MINUTE_IN_SECONDS ) {
			delete_option( $lock );
		}
		if ( ! add_option( $lock, time(), '', false ) ) {
			return;
		}
		wp_schedule_single_event( time(), 'turbopress_embed_revalidate', array( $resource, $repository, $options ) );
		do_action( 'turbopress_embed_cache_event', 'provider_validation', $key, array() );
	}

	public static function revalidate( $resource, $repository, $options ) {
		$key   = self::cache_key( $resource, $repository, $options );
		$entry = get_transient( $key );
		$result = self::fetch( $resource, $repository, $options, $entry );
		if ( ! is_wp_error( $result ) ) {
			self::store( $key, $result );
		}
		delete_option( $key . '_lock' );
	}

	private static function fetch( $resource, $repository, $options, $previous ) {
		$owner = rawurlencode( $repository['owner'] );
		$repo  = rawurlencode( $repository['repository'] );
		$base  = "https://api.github.com/repos/{$owner}/{$repo}";
		$url   = $base;
		if ( 'languages' === $resource ) {
			$url .= '/languages';
		} elseif ( 'file' === $resource ) {
			$url .= '/contents/' . implode( '/', array_map( 'rawurlencode', explode( '/', $options['path'] ) ) );
			if ( $options['branch'] ) {
				$url = add_query_arg( 'ref', $options['branch'], $url );
			}
		}

		$headers = array( 'Accept' => 'application/vnd.github+json', 'User-Agent' => 'TurboPress-Embed' );
		if ( is_array( $previous ) && ! empty( $previous['etag'] ) ) {
			$headers['If-None-Match'] = $previous['etag'];
		}
		if ( is_array( $previous ) && ! empty( $previous['last_modified'] ) ) {
			$headers['If-Modified-Since'] = $previous['last_modified'];
		}
		$token = apply_filters( 'turbopress_embed_github_token', '' );
		if ( $token ) {
			$headers['Authorization'] = 'Bearer ' . trim( $token );
		}
		$started  = microtime( true );
		$response = wp_remote_get(
			$url,
			array(
				'headers'             => $headers,
				'timeout'             => 12,
				'redirection'         => 0,
				'limit_response_size' => MB_IN_BYTES,
			)
		);
		do_action( 'turbopress_embed_provider_request', 'github', $resource, microtime( true ) - $started, $response );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$status = wp_remote_retrieve_response_code( $response );
		$ttl    = self::ttl( $resource );
		if ( 304 === $status && is_array( $previous ) ) {
			$previous['checked_at']   = time();
			$previous['revalidate_at'] = time() + $ttl;
			$previous['stale_until']  = time() + ( 7 * DAY_IN_SECONDS );
			$previous['changed']      = false;
			do_action( 'turbopress_embed_cache_event', 'provider_not_modified', self::cache_key( $resource, $repository, $options ), array() );
			return $previous;
		}
		if ( 200 !== $status ) {
			return new WP_Error( 'turbopress_github_error', __( 'GitHub data is temporarily unavailable.', 'turbopress-embed' ), array( 'status' => in_array( $status, array( 404, 422 ), true ) ? $status : 503 ) );
		}
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'turbopress_github_invalid', __( 'GitHub returned an invalid response.', 'turbopress-embed' ), array( 'status' => 502 ) );
		}
		$payload = self::normalize( $resource, $data, $repository, $options );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}
		$fingerprint = hash( 'sha256', wp_json_encode( $payload ) );
		return array(
			'payload'       => $payload,
			'fingerprint'   => $fingerprint,
			'etag'          => wp_remote_retrieve_header( $response, 'etag' ),
			'last_modified' => wp_remote_retrieve_header( $response, 'last-modified' ),
			'updated_at'    => time(),
			'checked_at'    => time(),
			'revalidate_at' => time() + $ttl,
			'stale_until'   => time() + ( 7 * DAY_IN_SECONDS ),
			'changed'       => ! is_array( $previous ) || $fingerprint !== $previous['fingerprint'],
		);
	}

	private static function normalize( $resource, $data, $repository, $options ) {
		if ( 'languages' === $resource ) {
			$total = array_sum( $data );
			$result = array();
			foreach ( $data as $name => $bytes ) {
				$result[] = array( 'name' => sanitize_text_field( $name ), 'percentage' => $total ? round( ( $bytes / $total ) * 100, 1 ) : 0 );
			}
			return $result;
		}
		if ( 'file' === $resource ) {
			if ( empty( $data['content'] ) || 'base64' !== $data['encoding'] ) {
				return new WP_Error( 'turbopress_invalid_file', __( 'The requested GitHub resource is not a file.', 'turbopress-embed' ), array( 'status' => 422 ) );
			}
			$content = base64_decode( preg_replace( '/\s+/', '', $data['content'] ), true );
			if ( false === $content || strlen( $content ) > 500000 ) {
				return new WP_Error( 'turbopress_file_too_large', __( 'The source file is unavailable or too large.', 'turbopress-embed' ), array( 'status' => 422 ) );
			}
			return array( 'content' => $content, 'name' => sanitize_file_name( $data['name'] ), 'path' => $options['path'], 'branch' => $options['branch'], 'html_url' => esc_url_raw( $data['html_url'] ) );
		}
		return array(
			'name'           => sanitize_text_field( $data['name'] ),
			'owner'          => sanitize_text_field( $data['owner']['login'] ),
			'description'    => sanitize_textarea_field( $data['description'] ),
			'language'       => sanitize_text_field( $data['language'] ),
			'topics'         => array_map( 'sanitize_text_field', isset( $data['topics'] ) ? $data['topics'] : array() ),
			'stars'          => absint( $data['stargazers_count'] ),
			'forks'          => absint( $data['forks_count'] ),
			'license'        => ! empty( $data['license']['spdx_id'] ) ? sanitize_text_field( $data['license']['spdx_id'] ) : '',
			'updated_at'     => sanitize_text_field( $data['updated_at'] ),
			'url'            => esc_url_raw( $data['html_url'] ),
			'homepage'       => esc_url_raw( $data['homepage'] ),
			'default_branch' => sanitize_text_field( $data['default_branch'] ),
		);
	}

	public static function render_dynamic_block( $attributes, $content, $block ) {
		$name = $block->name;
		if ( 'tpe/github-project' === $name ) {
			return self::render_github_project( $attributes );
		}
		if ( 'tpe/github-code' === $name ) {
			return self::render_github_code( $attributes );
		}
		if ( 'tpe/tech-stack' === $name && 'github' === ( $attributes['mode'] ?? 'manual' ) ) {
			return self::render_github_stack( $attributes );
		}
		return $content;
	}

	private static function render_github_project( $a ) {
		$repo = self::parse_repository_url( $a['repositoryUrl'] ?? '' );
		if ( is_wp_error( $repo ) ) return '';
		$result = self::get( 'repository', $repo, array( 'branch' => '', 'path' => '' ) );
		if ( is_wp_error( $result ) ) return '';
		$d = $result['payload'];
		$title = $a['customTitle'] ?? '';
		$description = $a['customDescription'] ?? '';
		$title = $title ? $title : $d['name'];
		$description = $description ? $description : $d['description'];
		$html = '<article ' . get_block_wrapper_attributes( array( 'class' => self::design_classes( $a, 'tpe-github-project', 'card' ) ) ) . '>';
		$html .= '<div class="tpe-project-eyebrow"><span class="tpe-repo-icon" aria-hidden="true"></span>' . esc_html__( 'GitHub Project', 'turbopress-embed' ) . '</div>';
		$html .= '<div class="tpe-project-content"><p class="tpe-project-title">' . esc_html( $title ) . '</p>';
		if ( $description ) $html .= '<p>' . esc_html( $description ) . '</p>';
		$html .= '</div><div class="tpe-project-footer"><div><ul class="tpe-meta">';
		if ( ! empty( $a['showLanguage'] ) && $d['language'] ) $html .= '<li class="tpe-language">' . esc_html( $d['language'] ) . '</li>';
		if ( ! empty( $a['showStars'] ) ) $html .= '<li><span aria-hidden="true">★</span> ' . sprintf( esc_html__( '%s stars', 'turbopress-embed' ), number_format_i18n( $d['stars'] ) ) . '</li>';
		if ( ! empty( $a['showForks'] ) ) $html .= '<li><span aria-hidden="true">⑂</span> ' . sprintf( esc_html__( '%s forks', 'turbopress-embed' ), number_format_i18n( $d['forks'] ) ) . '</li>';
		if ( ! empty( $a['showLicense'] ) && $d['license'] ) $html .= '<li>' . esc_html( $d['license'] ) . '</li>';
		if ( ! empty( $a['showUpdatedDate'] ) && $d['updated_at'] ) $html .= '<li>' . esc_html( mysql2date( get_option( 'date_format' ), $d['updated_at'] ) ) . '</li>';
		$html .= '</ul>';
		if ( ! empty( $a['showTopics'] ) && $d['topics'] ) $html .= '<p class="tpe-topics">' . implode( ' ', array_map( function( $topic ) { return '<span>' . esc_html( $topic ) . '</span>'; }, $d['topics'] ) ) . '</p>';
		$html .= '</div><div class="tpe-project-actions">';
		if ( ! empty( $a['showRepositoryButton'] ) ) $html .= '<a class="tpe-button is-primary" href="' . esc_url( $d['url'] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'View repository', 'turbopress-embed' ) . '<span aria-hidden="true">↗</span></a>';
		$demo = ! empty( $a['demoUrl'] ) ? $a['demoUrl'] : $d['homepage'];
		if ( ! empty( $a['showDemoButton'] ) && $demo ) $html .= '<a class="tpe-button" href="' . esc_url( $demo ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'View project', 'turbopress-embed' ) . '<span aria-hidden="true">↗</span></a>';
		return $html . '</div></div></article>';
	}

	private static function file_language( $path ) {
		$extension = strtolower( pathinfo( $path, PATHINFO_EXTENSION ) );
		$languages = array( 'css' => 'CSS', 'html' => 'HTML', 'js' => 'JavaScript', 'jsx' => 'JavaScript', 'json' => 'JSON', 'md' => 'Markdown', 'php' => 'PHP', 'py' => 'Python', 'rb' => 'Ruby', 'scss' => 'SCSS', 'ts' => 'TypeScript', 'tsx' => 'TypeScript', 'yml' => 'YAML', 'yaml' => 'YAML' );
		return $languages[ $extension ] ?? ( $extension ? strtoupper( $extension ) : __( 'Code', 'turbopress-embed' ) );
	}

	private static function render_github_code( $a ) {
		$repo = self::parse_repository_url( $a['repositoryUrl'] ?? '' );
		if ( is_wp_error( $repo ) || empty( $a['filePath'] ) ) return '';
		$branch = self::validate_ref( $a['branch'] ?? '' );
		$path = self::validate_path( $a['filePath'] );
		if ( is_wp_error( $branch ) || is_wp_error( $path ) ) return '';
		$result = self::get( 'file', $repo, array( 'branch' => $branch, 'path' => $path ) );
		if ( is_wp_error( $result ) ) return '';
		$d = $result['payload']; $lines = preg_split( '/\R/', $d['content'] );
		$start = max( 1, absint( $a['startLine'] ?? 1 ) ); $end = min( count( $lines ), max( $start, absint( $a['endLine'] ?? $start + 30 ) ), $start + 199 );
		$slice = array_slice( $lines, $start - 1, $end - $start + 1 );
		$language = self::file_language( $d['path'] );
		$filename = basename( $d['path'] );
		$title = ! empty( $a['title'] ) ? $a['title'] : $filename;
		$html = '<figure ' . get_block_wrapper_attributes( array( 'class' => self::design_classes( $a, 'tpe-github-code', 'default' ) ) ) . '><div class="tpe-code-header"><div class="tpe-code-heading">';
		$html .= '<span class="tpe-code-eyebrow"><span class="tpe-file-icon" aria-hidden="true"></span>' . esc_html( $language ) . ' ' . esc_html__( 'file', 'turbopress-embed' ) . '</span>';
		$html .= '<p class="tpe-code-title">' . esc_html( $title ) . '</p>';
		if ( ! empty( $a['showFilename'] ) && ! empty( $a['title'] ) ) $html .= '<figcaption>' . esc_html( $d['path'] ) . '</figcaption>';
		if ( ! empty( $a['description'] ) ) $html .= '<p>' . esc_html( $a['description'] ) . '</p>';
		$html .= '</div><button class="tpe-code-copy" type="button" data-copy-label="' . esc_attr__( 'Copy code', 'turbopress-embed' ) . '" data-copied-label="' . esc_attr__( 'Copied', 'turbopress-embed' ) . '" data-error-label="' . esc_attr__( 'Copy unavailable', 'turbopress-embed' ) . '"><span class="tpe-copy-icon" aria-hidden="true"></span><span aria-live="polite">' . esc_html__( 'Copy code', 'turbopress-embed' ) . '</span></button></div>';
		$highlights = array_filter( array_map( 'absint', preg_split( '/\s*,\s*/', $a['highlightedLines'] ?? '' ) ) );
		$html .= '<pre style="max-height:' . esc_attr( absint( $a['maxHeight'] ?? 480 ) ) . 'px"><code>';
		foreach ( $slice as $offset => $line ) {
			$number = $start + $offset;
			$class  = in_array( $number, $highlights, true ) ? 'tpe-code-line is-highlighted' : 'tpe-code-line';
			$html .= '<span class="' . esc_attr( $class ) . '">';
			if ( ! empty( $a['showLineNumbers'] ) ) {
				$html .= '<b aria-hidden="true">' . esc_html( $number ) . '</b>';
			}
			$html .= esc_html( $line ) . "\n</span>";
		}
		$html .= '</code></pre>';
		$html .= '<div class="tpe-code-footer"><span>' . esc_html( $language ) . ' · ' . sprintf( esc_html( _n( '%s line', '%s lines', count( $slice ), 'turbopress-embed' ) ), number_format_i18n( count( $slice ) ) );
		if ( ! empty( $d['branch'] ) ) $html .= ' · ' . esc_html( $d['branch'] );
		$html .= '</span>';
		if ( ! empty( $a['showGithubLink'] ) ) $html .= '<a href="' . esc_url( $d['html_url'] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'View source on GitHub', 'turbopress-embed' ) . ' <span aria-hidden="true">↗</span></a>';
		return $html . '</div></figure>';
	}

	private static function render_github_stack( $a ) {
		$repo = self::parse_repository_url( $a['repositoryUrl'] ?? '' ); if ( is_wp_error( $repo ) ) return '';
		$result = self::get( 'languages', $repo, array( 'branch' => '', 'path' => '' ) ); if ( is_wp_error( $result ) ) return '';
		$items = array_slice( $result['payload'], 0, max( 1, min( 20, absint( $a['maxLanguages'] ?? 6 ) ) ) );
		$html = '<div ' . get_block_wrapper_attributes( array( 'class' => self::design_classes( $a, 'tpe-tech-stack', 'badges' ) ) ) . '><ul>';
		foreach ( $items as $item ) $html .= '<li><span>' . esc_html( $item['name'] ) . '</span>' . ( ! empty( $a['showPercentages'] ) ? ' <small>' . esc_html( $item['percentage'] ) . '%</small>' : '' ) . '</li>';
		return $html . '</ul></div>';
	}

	private static function design_classes( $attributes, $block_class, $default_layout ) {
		$theme   = in_array( $attributes['theme'] ?? 'auto', array( 'auto', 'light', 'dark' ), true ) ? $attributes['theme'] : 'auto';
		$density = in_array( $attributes['density'] ?? 'comfortable', array( 'compact', 'comfortable' ), true ) ? $attributes['density'] : 'comfortable';
		$layout  = sanitize_html_class( $attributes['layout'] ?? $default_layout );

		return 'tpe-developer ' . $block_class . ' is-theme-' . $theme . ' is-density-' . $density . ' is-layout-' . $layout;
	}
}
