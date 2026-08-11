import { useBlockProps } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

const Save = ( { attributes } ) => {
  const { url, title, authorName, embedHtml } = attributes;
  const blockProps = useBlockProps.save( {
    className: 'turbopress-embed turbopress-embed--twitter',
    'data-provider': 'twitter',
    'data-embed-url': url,
    'data-embed-html': embedHtml,
  } );

  return (
    <div { ...blockProps }>
      <div className="turbopress-embed__card">
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={ sprintf(
            // translators: %s is the post title.
            __( 'Load post from X: %s', 'turbopress-embed' ),
            title || __( 'Post from X', 'turbopress-embed' ),
          ) }
        >
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">X / Twitter</span>
            <span className="turbopress-embed__title">
              { title || __( 'Post from X', 'turbopress-embed' ) }
            </span>
            { authorName && (
              <span className="turbopress-embed__hint">
                { __( 'Author:', 'turbopress-embed' ) } { authorName }
              </span>
            ) }
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">
            ↗
          </span>
        </button>
      </div>
    </div>
  );
};

export default Save;
