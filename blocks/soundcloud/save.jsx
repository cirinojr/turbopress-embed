import { useBlockProps } from '@wordpress/block-editor';

const Save = ({ attributes }) => {
  const { url, title, authorName, thumbnailUrl, playerUrl } = attributes;
  const blockProps = useBlockProps.save({
    className: 'turbopress-embed turbopress-embed--soundcloud',
    'data-provider': 'soundcloud',
    'data-embed-url': url,
    'data-player-url': playerUrl,
  });

  return (
    <div {...blockProps}>
      <div className="turbopress-embed__card" style={{ '--tpe-soundcloud-thumb': thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }}>
        <button type="button" className="turbopress-embed__trigger" aria-label={title || 'SoundCloud track'}>
          <span className="turbopress-embed__thumb" aria-hidden="true" />
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">SoundCloud</span>
            <span className="turbopress-embed__title">{title || 'SoundCloud track'}</span>
            {authorName && <span className="turbopress-embed__hint">{authorName}</span>}
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">▶</span>
        </button>
      </div>
    </div>
  );
};

export default Save;
