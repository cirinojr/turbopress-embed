import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const buildYoutubeThumb = ( videoId ) =>
  videoId ? `https://i.ytimg.com/vi/${ videoId }/hqdefault.jpg` : '';

const Save = ( { attributes } ) => {
  const {
    url,
    videoId,
    title,
    thumbnailUrl,
    channelName,
    channelUrl,
    channelThumbnail,
    subscriberText,
    channelVerified,
    playableInEmbed,
    showWatchButton,
    watchButtonLabel,
  } = attributes;
  const watchLabel =
    watchButtonLabel.trim() || __( 'Watch on YouTube', 'turbopress-embed' );
  const watchUrl = url || `https://www.youtube.com/watch?v=${ videoId }`;
  const blockProps = useBlockProps.save( {
    className: 'turbopress-embed turbopress-embed--youtube',
    'data-provider': 'youtube',
    'data-video-id': videoId,
    'data-video-url': url,
    'data-playable-in-embed': playableInEmbed ? 'true' : 'false',
  } );

  return (
    <div { ...blockProps }>
      <div
        className="turbopress-embed__card"
        style={ {
          '--tpe-thumb-image': `url(${
            thumbnailUrl || buildYoutubeThumb( videoId )
          })`,
        } }
      >
        <span className="turbopress-embed__media" aria-hidden="true" />
        <span className="turbopress-embed__overlay" aria-hidden="true" />
        <div className="turbopress-embed__top">
          { channelThumbnail &&
            ( channelUrl ? (
              <a
                className="turbopress-embed__channel-avatar-link"
                href={ channelUrl }
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ channelName }
              >
                <img
                  className="turbopress-embed__channel-avatar"
                  src={ channelThumbnail }
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ) : (
              <img
                className="turbopress-embed__channel-avatar"
                src={ channelThumbnail }
                alt=""
                width="40"
                height="40"
                loading="lazy"
                decoding="async"
              />
            ) ) }
          <div className="turbopress-embed__heading">
            <span className="turbopress-embed__title" title={ title }>
              { title || 'YouTube video' }
            </span>
            { channelName && (
              <span className="turbopress-embed__channel-line">
                { channelUrl ? (
                  <a
                    className="turbopress-embed__channel-name"
                    href={ channelUrl }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    { channelName }
                  </a>
                ) : (
                  <span className="turbopress-embed__channel-name">
                    { channelName }
                  </span>
                ) }
                { channelVerified && (
                  <span
                    className="turbopress-embed__verified"
                    aria-label="Verified channel"
                  >
                    ✓
                  </span>
                ) }
                { subscriberText && (
                  <span className="turbopress-embed__subscribers">
                    { subscriberText }
                  </span>
                ) }
              </span>
            ) }
          </div>
        </div>
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={
            playableInEmbed
              ? `Play video: ${ title || 'YouTube video' }`
              : `Video unavailable for embedded playback: ${
                  title || 'YouTube video'
                }`
          }
          disabled={ ! playableInEmbed }
        >
          <span className="turbopress-embed__play" aria-hidden="true">
            ▶
          </span>
        </button>
        { showWatchButton && (
          <a
            className="turbopress-embed__watch"
            href={ watchUrl }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ `${ watchLabel }: ${ title }` }
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M10 8.6 15.4 12 10 15.4V8.6ZM21 7.2a2.8 2.8 0 0 0-2-2C17.2 4.7 12 4.7 12 4.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 16.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.8 29 29 0 0 0-.5-4.8Z" />
            </svg>
            <span>{ watchLabel }</span>
          </a>
        ) }
      </div>
    </div>
  );
};

export default Save;
