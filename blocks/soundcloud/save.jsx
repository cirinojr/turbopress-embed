import { useBlockProps } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

const Save = ( { attributes } ) => {
  const { url, title, authorName, thumbnailUrl, playerUrl } = attributes;
  const blockProps = useBlockProps.save( {
    className: 'turbopress-embed turbopress-embed--soundcloud',
    'data-provider': 'soundcloud',
    'data-embed-url': url,
    'data-player-url': playerUrl,
  } );

  return (
    <div { ...blockProps }>
      <div
        className="turbopress-embed__card"
        style={ {
          '--tpe-soundcloud-thumb': thumbnailUrl
            ? `url(${ thumbnailUrl })`
            : 'none',
        } }
      >
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={ sprintf(
            // translators: %s is the SoundCloud track title.
            __( 'Play on SoundCloud: %s', 'turbopress-embed' ),
            title || __( 'SoundCloud track', 'turbopress-embed' ),
          ) }
        >
          <span className="turbopress-embed__thumb" aria-hidden="true" />
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">SoundCloud</span>
            <span className="turbopress-embed__title">
              { title || __( 'SoundCloud track', 'turbopress-embed' ) }
            </span>
            { authorName && (
              <span className="turbopress-embed__hint">{ authorName }</span>
            ) }
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">
            ▶
          </span>
        </button>
      </div>
    </div>
  );
};

export default Save;
