import { __, sprintf } from '@wordpress/i18n';

const getUsername = ( value ) => {
  const username = String( value || '' ).replace( /^@/, '' );
  return /^[A-Za-z0-9._]{2,24}$/.test( username ) ? username : '';
};

const getHashtag = ( value ) => {
  const name = String( value || '' ).replace( /^#/, '' );
  if ( ! /^[A-Za-z0-9._-]{1,100}$/.test( name ) ) {
    return null;
  }

  return {
    name,
    url: `https://www.tiktok.com/tag/${ encodeURIComponent(
      name.toLowerCase(),
    ) }`,
  };
};

const getMusicUrl = ( music ) => {
  if (
    ! /^[0-9]{10,30}$/.test( music?.id || '' ) ||
    ! /^[A-Za-z0-9._~-]+$/.test( music?.slug || '' )
  ) {
    return '';
  }

  return `https://www.tiktok.com/music/${ music.slug }-${ music.id }`;
};

const getTikTokImageUrl = ( value ) => {
  try {
    const url = new URL( value );
    const trustedSuffixes = [
      'tiktokcdn.com',
      'tiktokcdn-us.com',
      'tiktokcdn-eu.com',
      'muscdn.com',
      'ibytedtos.com',
      'byteimg.com',
      'toscdn.com',
    ];
    const trustedHost = trustedSuffixes.some(
      ( suffix ) =>
        url.hostname === suffix || url.hostname.endsWith( `.${ suffix }` ),
    );
    return url.protocol === 'https:' && trustedHost ? url.href : '';
  } catch {
    return '';
  }
};

const TikTokPreview = ( { attributes, editor = false } ) => {
  const {
    title,
    caption,
    authorName,
    authorUsername,
    authorDisplayName,
    authorAvatar,
    authorVerified,
    hashtags,
    music,
    thumbnailUrl,
  } = attributes;
  const username = getUsername( authorUsername );
  const profileUrl = username
    ? `https://www.tiktok.com/@${ encodeURIComponent( username ) }`
    : '';
  const normalizedHashtags = ( Array.isArray( hashtags ) ? hashtags : [] )
    .map( ( hashtag ) => getHashtag( hashtag?.name ) )
    .filter( Boolean );
  const musicUrl = getMusicUrl( music );
  const avatarUrl = getTikTokImageUrl( authorAvatar );
  const coverUrl = getTikTokImageUrl( thumbnailUrl );
  const videoCaption = caption || title || '';
  const preventEditorNavigation = editor
    ? ( event ) => event.preventDefault()
    : undefined;
  let authorSummary = null;

  if ( username ) {
    authorSummary = (
      <a
        className="turbopress-embed__summary-author"
        href={ profileUrl }
        target="_blank"
        rel="noopener noreferrer"
        onClick={ preventEditorNavigation }
      >
        @{ username }
        { authorVerified && (
          <span className="turbopress-embed__verified">
            <span className="screen-reader-text">
              { __( 'Verified creator', 'turbopress-embed' ) }
            </span>
            ✓
          </span>
        ) }
      </a>
    );
  } else if ( authorDisplayName || authorName ) {
    authorSummary = (
      <span className="turbopress-embed__summary-author">
        { authorDisplayName || authorName }
      </span>
    );
  }

  return (
    <div className="turbopress-embed__card">
      <div className="turbopress-embed__media-wrap">
        <span className="turbopress-embed__media" aria-hidden="true">
          { coverUrl && (
            <img
              className="turbopress-embed__cover"
              src={ coverUrl }
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) }
        </span>
        <span className="turbopress-embed__overlay" aria-hidden="true" />
        <span className="turbopress-embed__topbar" aria-hidden="true">
          <span className="turbopress-embed__brand">TikTok</span>
          <span className="turbopress-embed__logo">♪</span>
        </span>
        { profileUrl && avatarUrl && (
          <a
            className="turbopress-embed__avatar-link"
            href={ profileUrl }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ sprintf(
              // translators: %s is a TikTok username.
              __( 'View @%s on TikTok', 'turbopress-embed' ),
              username,
            ) }
            onClick={ preventEditorNavigation }
          >
            <img
              className="turbopress-embed__avatar"
              src={ avatarUrl }
              alt=""
              width="44"
              height="44"
              loading="lazy"
              decoding="async"
            />
          </a>
        ) }
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={ sprintf(
            // translators: %s is the TikTok video caption.
            __( 'Play "%s" on TikTok', 'turbopress-embed' ),
            videoCaption || __( 'video', 'turbopress-embed' ),
          ) }
        >
          <span className="turbopress-embed__play" aria-hidden="true">
            ▶
          </span>
        </button>
      </div>
      <div className="turbopress-embed__summary">
        <span className="turbopress-embed__provider">TikTok</span>
        { authorSummary }
        { videoCaption && (
          <p className="turbopress-embed__caption" title={ videoCaption }>
            { videoCaption }
          </p>
        ) }
        { normalizedHashtags.length > 0 && (
          <p className="turbopress-embed__hashtags">
            { normalizedHashtags.map( ( hashtag ) => (
              <a
                key={ hashtag.url }
                href={ hashtag.url }
                target="_blank"
                rel="noopener noreferrer"
                onClick={ preventEditorNavigation }
              >
                #{ hashtag.name }
              </a>
            ) ) }
          </p>
        ) }
        { musicUrl && music?.title && (
          <a
            className="turbopress-embed__summary-music"
            href={ musicUrl }
            target="_blank"
            rel="noopener noreferrer"
            onClick={ preventEditorNavigation }
          >
            ♬ { music.title }
          </a>
        ) }
      </div>
    </div>
  );
};

export default TikTokPreview;
