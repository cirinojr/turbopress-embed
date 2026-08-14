<?php

defined( 'ABSPATH' ) || exit;

/** Internal, uploads-backed cache for images selected by validated provider metadata. */
final class TurboPress_Remote_Image_Cache {
	private const MAX_BYTES = 5 * MB_IN_BYTES;
	private const RETENTION = 90 * DAY_IN_SECONDS;
	private const DIRECTORY = 'turbopress-embed/remote-images';
	private const CLEANUP_HOOK = 'turbopress_embed_cleanup_remote_images';
	private const MIME_EXTENSIONS = array(
		'image/jpeg' => 'jpg',
		'image/png'  => 'png',
		'image/webp' => 'webp',
		'image/gif'  => 'gif',
	);

	public static function init() {
		add_action( self::CLEANUP_HOOK, array( __CLASS__, 'cleanup' ) );
		if ( ! wp_next_scheduled( self::CLEANUP_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CLEANUP_HOOK );
		}
	}

	/**
	 * Localize an image already selected by trusted provider metadata.
	 *
	 * Failure is deliberately non-fatal: an existing local image, then the safe
	 * upstream URL, remains available to the preview.
	 */
	public static function localize( $remote_url, $provider, $resource, $role, $previous_url = '' ) {
		$remote_url = esc_url_raw( (string) $remote_url );
		if ( ! self::is_safe_url( $remote_url ) ) {
			return $previous_url ?: '';
		}

		$provider = sanitize_key( $provider );
		$role     = sanitize_key( $role );
		if ( ! $provider || ! $role || '' === (string) $resource ) {
			return $previous_url ?: $remote_url;
		}

		$uploads = wp_upload_dir();
		if ( ! empty( $uploads['error'] ) ) {
			return $previous_url ?: $remote_url;
		}

		$identity = hash( 'sha256', $provider . '|' . (string) $resource . '|' . $role );
		$directory = trailingslashit( $uploads['basedir'] ) . self::DIRECTORY . '/' . $provider;
		$base_url  = trailingslashit( $uploads['baseurl'] ) . self::DIRECTORY . '/' . $provider;
		$source_id = hash( 'sha256', self::canonical_source( $remote_url ) );
		$existing  = self::find_existing( $directory, $base_url, $identity, $source_id );

		if ( $existing && $source_id === ( $existing['meta']['source_id'] ?? '' ) ) {
			$existing = self::upgrade_existing_to_webp( $existing, $base_url );
			@touch( $existing['path'] );
			self::event( 'remote_image.cache_hit', $identity );
			return $existing['url'];
		}

		$lock = 'tpe_image_lock_' . $identity;
		$locked_at = (int) get_option( $lock, 0 );
		if ( $locked_at && $locked_at < time() - MINUTE_IN_SECONDS ) delete_option( $lock );
		if ( ! add_option( $lock, time(), '', false ) ) {
			return $existing['url'] ?? ( $previous_url ?: $remote_url );
		}

		$result = self::download( $remote_url, $directory, $base_url, $identity, $source_id, $provider, $resource, $role );
		delete_option( $lock );
		if ( is_wp_error( $result ) ) {
			self::event( 'remote_image.download_failed', $identity, array( 'code' => $result->get_error_code() ) );
			return $existing['url'] ?? ( $previous_url ?: $remote_url );
		}
		return $result['url'];
	}

	private static function download( $url, $directory, $base_url, $identity, $source_id, $provider, $resource, $role ) {
		if ( ! wp_mkdir_p( $directory ) || ! is_writable( $directory ) ) {
			return new WP_Error( 'tpe_image_not_writable' );
		}
		if ( ! function_exists( 'wp_tempnam' ) ) require_once ABSPATH . 'wp-admin/includes/file.php';
		$temp = wp_tempnam( 'turbopress-image-' . $identity, $directory );
		if ( ! $temp ) return new WP_Error( 'tpe_image_temp_failed' );

		$response = wp_safe_remote_get( $url, array(
			'timeout' => 15, 'redirection' => 3, 'stream' => true, 'filename' => $temp,
			'limit_response_size' => self::MAX_BYTES + 1, 'user-agent' => 'TurboPress Embed remote image cache',
		) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) || ! file_exists( $temp ) ) {
			@unlink( $temp );
			return new WP_Error( 'tpe_image_download_failed' );
		}
		if ( filesize( $temp ) > self::MAX_BYTES ) {
			@unlink( $temp );
			return new WP_Error( 'tpe_image_too_large' );
		}
		$dimensions = wp_getimagesize( $temp );
		$mime = is_array( $dimensions ) ? strtolower( (string) ( $dimensions['mime'] ?? '' ) ) : '';
		if ( ! isset( self::MIME_EXTENSIONS[ $mime ] ) ) {
			@unlink( $temp );
			self::event( 'remote_image.validation_failed', $identity );
			return new WP_Error( 'tpe_image_invalid_type' );
		}

		$converted = self::convert_to_webp( $temp, $mime );
		if ( $converted ) {
			@unlink( $temp );
			$temp = $converted;
			$mime = 'image/webp';
		}

		$extension = self::MIME_EXTENSIONS[ $mime ];
		$target = $directory . '/' . $identity . '-' . substr( $source_id, 0, 16 ) . '.' . $extension;
		if ( is_file( $target ) && self::valid_local_image( $target ) ) {
			@unlink( $temp );
			return array( 'path' => $target, 'url' => $base_url . '/' . basename( $target ), 'mime' => $mime );
		}
		if ( ! @rename( $temp, $target ) ) {
			@unlink( $temp );
			return new WP_Error( 'tpe_image_move_failed' );
		}
		$meta = array(
			'source_url' => $url, 'source_id' => $source_id, 'local_url' => $base_url . '/' . basename( $target ),
			'mime_type' => $mime, 'fetched_at' => time(), 'provider' => $provider,
			'resource_identity' => hash( 'sha256', (string) $resource ), 'image_role' => $role,
		);
		file_put_contents( $target . '.json', wp_json_encode( $meta ), LOCK_EX );
		self::event( 'remote_image.download', $identity );
		return array( 'path' => $target, 'url' => $meta['local_url'], 'mime' => $mime );
	}

	/** Convert static JPEG/PNG previews when the active WordPress image editor supports WebP. */
	private static function convert_to_webp( $source, $mime ) {
		if ( ! in_array( $mime, array( 'image/jpeg', 'image/png' ), true ) ) return '';
		if ( ! function_exists( 'wp_get_image_editor' ) ) require_once ABSPATH . WPINC . '/media.php';
		if ( ! function_exists( 'wp_image_editor_supports' ) || ! wp_image_editor_supports( array( 'mime_type' => 'image/webp' ) ) ) return '';

		$editor = wp_get_image_editor( $source );
		if ( is_wp_error( $editor ) ) return '';
		$destination = $source . '.webp';
		$saved = $editor->save( $destination, 'image/webp' );
		if ( is_wp_error( $saved ) || ! is_file( $destination ) || ! self::valid_local_image( $destination ) ) {
			@unlink( $destination );
			return '';
		}
		return $destination;
	}

	/** Upgrade an existing JPEG/PNG cache hit without another provider request. */
	private static function upgrade_existing_to_webp( $existing, $base_url ) {
		$size = wp_getimagesize( $existing['path'] );
		$mime = is_array( $size ) ? strtolower( (string) ( $size['mime'] ?? '' ) ) : '';
		$converted = self::convert_to_webp( $existing['path'], $mime );
		if ( ! $converted ) return $existing;

		$target = preg_replace( '/\.[^.]+$/', '.webp', $existing['path'] );
		if ( ! @rename( $converted, $target ) ) {
			@unlink( $converted );
			return $existing;
		}
		$meta = $existing['meta'];
		$meta['local_url'] = $base_url . '/' . basename( $target );
		$meta['mime_type'] = 'image/webp';
		file_put_contents( $target . '.json', wp_json_encode( $meta ), LOCK_EX );
		@unlink( $existing['path'] . '.json' );
		@unlink( $existing['path'] );
		return array( 'path' => $target, 'url' => $meta['local_url'], 'meta' => $meta );
	}

	private static function find_existing( $directory, $base_url, $identity, $source_id ) {
		$matches = glob( $directory . '/' . $identity . '-*.*' ) ?: array();
		$fallback = null;
		foreach ( $matches as $path ) {
			if ( ! is_file( $path ) || ! self::valid_local_image( $path ) ) continue;
			$meta = is_file( $path . '.json' ) ? json_decode( (string) file_get_contents( $path . '.json' ), true ) : array();
			$candidate = array( 'path' => $path, 'url' => $base_url . '/' . basename( $path ), 'meta' => is_array( $meta ) ? $meta : array() );
			if ( $source_id === ( $candidate['meta']['source_id'] ?? '' ) ) return $candidate;
			if ( ! $fallback || filemtime( $path ) > filemtime( $fallback['path'] ) ) $fallback = $candidate;
		}
		return $fallback;
	}

	private static function valid_local_image( $path ) {
		if ( filesize( $path ) > self::MAX_BYTES ) return false;
		$size = wp_getimagesize( $path );
		return is_array( $size ) && isset( self::MIME_EXTENSIONS[ strtolower( (string) ( $size['mime'] ?? '' ) ) ] );
	}

	private static function canonical_source( $url ) {
		$parts = wp_parse_url( $url );
		return strtolower( $parts['scheme'] . '://' . $parts['host'] ) . ( $parts['path'] ?? '/' );
	}

	private static function is_safe_url( $url ) {
		$parts = wp_parse_url( $url );
		return is_array( $parts ) && in_array( strtolower( $parts['scheme'] ?? '' ), array( 'http', 'https' ), true ) && (bool) wp_http_validate_url( $url );
	}

	public static function cleanup() {
		$uploads = wp_upload_dir();
		$root = empty( $uploads['error'] ) ? trailingslashit( $uploads['basedir'] ) . self::DIRECTORY : '';
		if ( ! $root || ! is_dir( $root ) ) return;
		$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $iterator as $file ) {
			$path = $file->getPathname();
			if ( $file->isFile() && $file->getMTime() < time() - self::RETENTION ) @unlink( $path );
		}
	}

	private static function event( $name, $identity, $context = array() ) {
		do_action( 'turbopress_embed_cache_event', $name, $identity, $context );
	}
}
