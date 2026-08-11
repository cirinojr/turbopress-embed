const SOUNDCLOUD_HOSTS = new Set( [
  'soundcloud.com',
  'www.soundcloud.com',
  'on.soundcloud.com',
] );

export const normalizeSoundCloudUrl = ( value ) => {
  try {
    const url = new URL( value );
    const path = url.pathname.replace( /\/+$/, '' );

    if (
      url.protocol !== 'https:' ||
      ! SOUNDCLOUD_HOSTS.has( url.hostname ) ||
      ! path
    ) {
      return '';
    }

    return `https://${ url.hostname }${ path }`;
  } catch {
    return '';
  }
};

export const getSoundCloudPlayerUrl = ( resourceUrl ) => {
  const normalizedUrl = normalizeSoundCloudUrl( resourceUrl );
  if ( ! normalizedUrl ) {
    return '';
  }

  const playerUrl = new URL( 'https://w.soundcloud.com/player/' );
  playerUrl.searchParams.set( 'url', normalizedUrl );
  playerUrl.searchParams.set( 'auto_play', 'true' );
  return playerUrl.toString();
};
