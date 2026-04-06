import { useBlockProps } from '@wordpress/block-editor';

const buildYoutubeThumb = (videoId) =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

const Save = ({ attributes }) => {
  const { url, videoId, title, thumbnailUrl } = attributes;
  const blockProps = useBlockProps.save({
    className: 'turbopress-embed turbopress-embed--youtube',
    'data-provider': 'youtube',
    'data-video-id': videoId,
    'data-video-url': url,
  });

  return (
    <div {...blockProps}>
      <div className="turbopress-embed__card" style={{ '--tpe-thumb-image': `url(${thumbnailUrl || buildYoutubeThumb(videoId)})` }}>
        <button type="button" className="turbopress-embed__trigger" aria-label={title || 'YouTube video'}>
          <span className="turbopress-embed__media" aria-hidden="true" />
          <span className="turbopress-embed__overlay" aria-hidden="true" />
          <span className="turbopress-embed__play" aria-hidden="true">▶</span>
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">YouTube</span>
            <span className="turbopress-embed__title">{title || 'YouTube video'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Save;
