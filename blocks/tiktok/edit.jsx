import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import { EmbedEditorActions, EmbedErrorNotice, EmbedUrlPlaceholder } from '../shared/editor-ui';

const isValidTikTokUrl = (url) =>
  /^https:\/\/(www\.)?tiktok\.com\/.+|^https:\/\/vm\.tiktok\.com\/.+/i.test(url);

const getSubtitle = (value) => {
  if (!value) {
    return __('Preview do video', 'turbopress-embed');
  }

  const normalized = value.trim();
  return normalized.length > 48 ? `${normalized.slice(0, 45)}...` : normalized;
};

const Edit = ({ attributes, setAttributes }) => {
  const { url, title, authorName, thumbnailUrl, embedHtml } = attributes;
  const [inputUrl, setInputUrl] = useState(url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const blockProps = useBlockProps({
    className: 'turbopress-embed turbopress-embed--tiktok is-editor',
    'data-provider': 'tiktok',
  });

  const onEmbed = async () => {
    const normalizedUrl = inputUrl.trim();

    if (!isValidTikTokUrl(normalizedUrl)) {
      setError(__('Use a valid TikTok URL.', 'turbopress-embed'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetchData('tpe_get_tiktok', { url: normalizedUrl });

      if (!response?.success || !response?.data?.embedHtml) {
        throw new Error(response?.message || __('Could not load TikTok metadata.', 'turbopress-embed'));
      }

      setAttributes({
        url: normalizedUrl,
        title: response.data?.title || __('TikTok video', 'turbopress-embed'),
        authorName: response.data?.authorName || '',
        thumbnailUrl: response.data?.thumbnail || '',
        embedHtml: response.data?.embedHtml || '',
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setAttributes({
      url: '',
      title: '',
      authorName: '',
      thumbnailUrl: '',
      embedHtml: '',
    });
    setInputUrl('');
    setError('');
  };

  if (!url || !embedHtml) {
    return (
      <div {...blockProps}>
        <EmbedUrlPlaceholder
          icon="format-video"
          label={__('TurboPress TikTok', 'turbopress-embed')}
          instructions={__('Create a lightweight TikTok preview and only load the embed on click.', 'turbopress-embed')}
          inputLabel={__('TikTok URL', 'turbopress-embed')}
          placeholder="https://www.tiktok.com/@username/video/..."
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
    <div {...blockProps} data-embed-url={url} data-embed-html={embedHtml}>
      <div className="turbopress-embed__card" style={{ '--tpe-thumb-image': thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }}>
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={sprintf(__('Play "%s" on TikTok', 'turbopress-embed'), title || __('video', 'turbopress-embed'))}
        >
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
              <span>{__('Assista a mais videos', 'turbopress-embed')}</span>
              <span className="turbopress-embed__summary-button">{__('Assistir agora', 'turbopress-embed')}</span>
            </span>
            <span className="turbopress-embed__provider">TikTok</span>
            <span className="turbopress-embed__summary-title">{title || __('TikTok video', 'turbopress-embed')}</span>
            <span className="turbopress-embed__summary-author">@{authorName || 'tiktok'}</span>
            <span className="turbopress-embed__summary-music">♪ {__('faixa original', 'turbopress-embed')}</span>
          </span>
        </button>
      </div>
      <EmbedEditorActions isLoading={isLoading} onReset={onReset} />
      <EmbedErrorNotice error={error} />
    </div>
  );
};

export default Edit;
