import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import { EmbedEditorActions, EmbedErrorNotice, EmbedUrlPlaceholder } from '../shared/editor-ui';

const isValidSoundCloudUrl = (url) =>
  /^https:\/\/(www\.)?soundcloud\.com\/.+|^https:\/\/on\.soundcloud\.com\/.+/i.test(url);

const Edit = ({ attributes, setAttributes }) => {
  const { url, title, authorName, thumbnailUrl, playerUrl } = attributes;
  const [inputUrl, setInputUrl] = useState(url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const blockProps = useBlockProps({
    className: 'turbopress-embed turbopress-embed--soundcloud is-editor',
    'data-provider': 'soundcloud',
  });

  const onEmbed = async () => {
    const normalizedUrl = inputUrl.trim();

    if (!isValidSoundCloudUrl(normalizedUrl)) {
      setError(__('Use a valid SoundCloud URL.', 'turbopress-embed'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetchData('tpe_get_soundcloud', { url: normalizedUrl });

      if (!response?.success || !response?.data?.playerUrl) {
        throw new Error(response?.message || __('Could not load SoundCloud metadata.', 'turbopress-embed'));
      }

      setAttributes({
        url: normalizedUrl,
        title: response.data?.title || __('SoundCloud track', 'turbopress-embed'),
        authorName: response.data?.authorName || '',
        thumbnailUrl: response.data?.thumbnail || '',
        playerUrl: response.data?.playerUrl || '',
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
      playerUrl: '',
    });
    setInputUrl('');
    setError('');
  };

  if (!url || !playerUrl) {
    return (
      <div {...blockProps}>
        <EmbedUrlPlaceholder
          icon="format-audio"
          label={__('TurboPress SoundCloud', 'turbopress-embed')}
          instructions={__('Create a lightweight audio card and load the SoundCloud player only after interaction.', 'turbopress-embed')}
          inputLabel={__('SoundCloud URL', 'turbopress-embed')}
          placeholder="https://soundcloud.com/artist/track"
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
    <div {...blockProps} data-embed-url={url} data-player-url={playerUrl}>
      <div className="turbopress-embed__card" style={{ '--tpe-soundcloud-thumb': thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }}>
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={sprintf(__('Play "%s" on SoundCloud', 'turbopress-embed'), title || __('track', 'turbopress-embed'))}
        >
          <span className="turbopress-embed__thumb" aria-hidden="true" />
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">SoundCloud</span>
            <span className="turbopress-embed__title">{title || __('SoundCloud track', 'turbopress-embed')}</span>
            {authorName && <span className="turbopress-embed__hint">{authorName}</span>}
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">▶</span>
        </button>
      </div>
      <EmbedEditorActions isLoading={isLoading} onReset={onReset} />
      <EmbedErrorNotice error={error} />
    </div>
  );
};

export default Edit;
