import { useBlockProps } from '@wordpress/block-editor';

const getSubtitle = (value) => {
  if (!value) {
    return 'Preview do video';
  }

  const normalized = value.trim();
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
};

const Save = ({ attributes }) => {
  const { url, title, authorName, thumbnailUrl, embedHtml } = attributes;
  const blockProps = useBlockProps.save({
    className: 'turbopress-embed turbopress-embed--tiktok',
    'data-provider': 'tiktok',
    'data-embed-url': url,
    'data-embed-html': embedHtml,
  });

  return (
    <div {...blockProps}>
      <div className="turbopress-embed__card" style={{ '--tpe-thumb-image': thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }}>
        <button type="button" className="turbopress-embed__trigger" aria-label={title || 'TikTok video'}>
          <span className="turbopress-embed__media-wrap" aria-hidden="true">
            <span className="turbopress-embed__media" />
            <span className="turbopress-embed__overlay" />
            <span className="turbopress-embed__topbar">
              <span className="turbopress-embed__brand">TikTok</span>
              <span className="turbopress-embed__logo">♪</span>
            </span>
            <span className="turbopress-embed__rail">
              <span className="turbopress-embed__rail-dot" />
              <span className="turbopress-embed__rail-dot" />
              <span className="turbopress-embed__rail-dot" />
            </span>
            <span className="turbopress-embed__subtitle">{getSubtitle(title)}</span>
            <span className="turbopress-embed__play">▶</span>
          </span>
          <span className="turbopress-embed__summary">
            <span className="turbopress-embed__summary-cta">
              <span>Assista a mais videos</span>
              <span className="turbopress-embed__summary-button">Assistir agora</span>
            </span>
            <span className="turbopress-embed__provider">TikTok</span>
            <span className="turbopress-embed__summary-title">{title || 'TikTok video'}</span>
            <span className="turbopress-embed__summary-author">@{authorName || 'tiktok'}</span>
            <span className="turbopress-embed__summary-music">♪ faixa original</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Save;
