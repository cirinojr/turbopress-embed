const SPOTIFY_RESOURCE_TYPES = [
  'track',
  'album',
  'playlist',
  'episode',
  'artist',
  'show',
];

export const parseSpotifyUrl = ( value ) => {
  try {
    const url = new URL( value );

    if ( url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' ) {
      return null;
    }

    const parts = url.pathname.split( '/' ).filter( Boolean );
    const isEmbed = parts[ 0 ] === 'embed';
    const type = parts[ isEmbed ? 1 : 0 ];
    const id = parts[ isEmbed ? 2 : 1 ];
    const suffix = parts[ isEmbed ? 3 : 2 ];
    let expectedLength = 2;
    if ( isEmbed ) {
      expectedLength = type === 'show' ? 4 : 3;
    }

    if (
      parts.length !== expectedLength ||
      ! SPOTIFY_RESOURCE_TYPES.includes( type ) ||
      ! /^[A-Za-z0-9]{10,64}$/.test( id ) ||
      ( type === 'show' && isEmbed && suffix !== 'video' )
    ) {
      return null;
    }

    return { provider: 'spotify', type, id };
  } catch {
    return null;
  }
};

export const getSpotifyPublicUrl = ( { type, id } ) =>
  `https://open.spotify.com/${ type }/${ id }`;

export const getSpotifyEmbedUrl = ( { type, id } ) =>
  `https://open.spotify.com/embed/${ type }/${ id }${
    type === 'show' ? '/video' : ''
  }`;
