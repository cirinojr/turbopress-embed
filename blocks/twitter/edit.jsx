import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import { EmbedEditorActions, EmbedErrorNotice, EmbedUrlPlaceholder } from '../shared/editor-ui';

const isValidTwitterUrl = (url) =>
  /^https:\/\/(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/i.test(url);

const Edit = ({ attributes, setAttributes }) => {
  const { url, title, authorName, embedHtml } = attributes;
  const [inputUrl, setInputUrl] = useState(url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const blockProps = useBlockProps({
    className: 'turbopress-embed turbopress-embed--twitter is-editor',
    'data-provider': 'twitter',
  });

  const onEmbed = async () => {
    const normalizedUrl = inputUrl.trim();

    if (!isValidTwitterUrl(normalizedUrl)) {
      setError(__('Use a valid X/Twitter post URL.', 'turbopress-embed'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetchData('tpe_get_twitter', { url: normalizedUrl });

      if (!response?.success || !response?.data?.embedHtml) {
        throw new Error(response?.message || __('Could not load X/Twitter metadata.', 'turbopress-embed'));
      }

      setAttributes({
        url: normalizedUrl,
        title: response.data?.title || __('Post from X', 'turbopress-embed'),
        authorName: response.data?.authorName || '',
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
      embedHtml: '',
    });
    setInputUrl('');
    setError('');
  };

  if (!url || !embedHtml) {
    return (
      <div {...blockProps}>
        <EmbedUrlPlaceholder
          icon="twitter"
          label={__('TurboPress X / Twitter', 'turbopress-embed')}
          instructions={__('Render a lightweight tweet card first and load widgets only on interaction.', 'turbopress-embed')}
          inputLabel={__('X/Twitter URL', 'turbopress-embed')}
          placeholder="https://x.com/user/status/..."
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
      <div className="turbopress-embed__card">
        <button
          type="button"
          className="turbopress-embed__trigger"
          aria-label={sprintf(__('Open post "%s" from X', 'turbopress-embed'), title || __('post', 'turbopress-embed'))}
        >
          <span className="turbopress-embed__meta">
            <span className="turbopress-embed__provider">X / Twitter</span>
            <span className="turbopress-embed__title">{title || __('Post from X', 'turbopress-embed')}</span>
            {authorName && <span className="turbopress-embed__hint">{__('Author:', 'turbopress-embed')} {authorName}</span>}
          </span>
          <span className="turbopress-embed__play" aria-hidden="true">↗</span>
        </button>
      </div>
      <EmbedEditorActions isLoading={isLoading} onReset={onReset} />
      <EmbedErrorNotice error={error} />
    </div>
  );
};

export default Edit;
