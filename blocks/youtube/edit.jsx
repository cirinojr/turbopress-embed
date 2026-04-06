import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import { EmbedEditorActions, EmbedErrorNotice, EmbedUrlPlaceholder } from '../shared/editor-ui';

const getYoutubeVideoId = (url) => {
  if (!url) {
    return '';
  }

  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) ||
    url.match(/^[a-zA-Z0-9_-]{11}$/);

  return match?.[1] || match?.[0] || '';
};

const buildYoutubeThumb = (videoId) =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

const Edit = ({ attributes, setAttributes }) => {
  const { url, title, videoId, thumbnailUrl } = attributes;
  const [inputUrl, setInputUrl] = useState(url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const blockProps = useBlockProps({
    className: 'turbopress-embed turbopress-embed--youtube is-editor',
    'data-provider': 'youtube',
  });

  const resolveMetadata = async (embedUrl, parsedVideoId) => {
    const response = await fetchData('tpe_get_youtube', embedUrl);

    if (!response?.success) {
      throw new Error(response?.message || __('Could not load YouTube metadata.', 'turbopress-embed'));
    }

    const fetchedTitle = response.data?.title || __('Untitled video', 'turbopress-embed');
    const fetchedThumb = response.data?.thumbnail || buildYoutubeThumb(parsedVideoId);

    setAttributes({
      url: embedUrl,
      videoId: parsedVideoId,
      title: fetchedTitle,
      thumbnailUrl: fetchedThumb,
    });
  };

  const onEmbed = async () => {
    const parsedVideoId = getYoutubeVideoId(inputUrl.trim());

    if (!parsedVideoId) {
      setError(__('Use a valid YouTube URL or video ID.', 'turbopress-embed'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await resolveMetadata(inputUrl.trim(), parsedVideoId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setAttributes({
      url: '',
      videoId: '',
      title: '',
      thumbnailUrl: '',
    });
    setInputUrl('');
    setError('');
  };

  if (!videoId) {
    return (
      <div {...blockProps}>
        <EmbedUrlPlaceholder
          icon="video-alt3"
          label={__('TurboPress YouTube', 'turbopress-embed')}
          instructions={__('Create a fast YouTube preview card and load the real player only on click.', 'turbopress-embed')}
          inputLabel={__('YouTube URL', 'turbopress-embed')}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          inputUrl={inputUrl}
          onInputChange={setInputUrl}
          onSubmit={onEmbed}
          isLoading={isLoading}
          error={error}
        />
      </div>
    );
  }

  return (
    <div {...blockProps} data-video-id={videoId} data-video-url={url}>
      <div className="turbopress-embed__card" style={{ '--tpe-thumb-image': `url(${thumbnailUrl || buildYoutubeThumb(videoId)})` }}>
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={sprintf(__('Play "%s" on YouTube', 'turbopress-embed'), title || __('video', 'turbopress-embed'))}
        >
          <span className="turbopress-embed__media" aria-hidden="true" />
          <span className="turbopress-embed__overlay" aria-hidden="true" />
          <span className="turbopress-embed__play" aria-hidden="true">▶</span>
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">YouTube</span>
            <span className="turbopress-embed__title">{title || __('YouTube video', 'turbopress-embed')}</span>
          </span>
        </button>
      </div>
      <EmbedEditorActions isLoading={isLoading} onReset={onReset} />
      <EmbedErrorNotice error={error} />
    </div>
  );
};

export default Edit;
