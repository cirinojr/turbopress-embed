import { useBlockProps } from '@wordpress/block-editor';

const Save = ({ attributes }) => {
  const { url, title, thumbnailUrl, backgroundColor } = attributes;
  const blockProps = useBlockProps.save({
    className: 'turbopress-embed turbopress-embed--spotify',
    'data-provider': 'spotify',
    'data-embed-url': url,
  });

  return (
    <div {...blockProps}>
      <div className="turbopress-embed__card" style={{ '--tpe-spotify-bg': backgroundColor, '--tpe-spotify-thumb': `url(${thumbnailUrl})` }}>
        <button type="button" className="turbopress-embed__trigger" aria-label={title || 'Spotify content'}>
          <span className="turbopress-embed__thumb" aria-hidden="true" />
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">Spotify</span>
            <span className="turbopress-embed__title">{title || 'Spotify content'}</span>
            <span className="turbopress-embed__hint">Click to load embedded player</span>
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">▶</span>
        </button>
      </div>
    </div>
  );
};

export default Save;
