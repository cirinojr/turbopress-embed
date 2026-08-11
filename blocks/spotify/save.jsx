import { useBlockProps } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

const Save = ( { attributes } ) => {
  const { url, title, thumbnailUrl, backgroundColor, embedUrl } = attributes;
  const blockProps = useBlockProps.save( {
    className: 'turbopress-embed turbopress-embed--spotify',
    'data-provider': 'spotify',
    'data-embed-url': embedUrl || url,
  } );

  return (
    <div { ...blockProps }>
      <div
        className="turbopress-embed__card"
        style={ {
          '--tpe-spotify-bg': backgroundColor,
          '--tpe-spotify-thumb': `url(${ thumbnailUrl })`,
        } }
      >
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={ sprintf(
            // translators: %s is the Spotify content title.
            __( 'Play on Spotify: %s', 'turbopress-embed' ),
            title || __( 'Spotify content', 'turbopress-embed' ),
          ) }
        >
          <span className="turbopress-embed__thumb" aria-hidden="true" />
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">Spotify</span>
            <span className="turbopress-embed__title">
              { title || __( 'Spotify content', 'turbopress-embed' ) }
            </span>
            <span className="turbopress-embed__hint">
              { __(
                'Activate to load the embedded player',
                'turbopress-embed',
              ) }
            </span>
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
