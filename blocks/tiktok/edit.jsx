import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import {
  EmbedEditorActions,
  EmbedErrorNotice,
  EmbedUrlPlaceholder,
} from '../shared/editor-ui';
import TikTokPreview from './preview';

const isValidTikTokUrl = ( url ) =>
  /^https:\/\/(www\.)?tiktok\.com\/.+|^https:\/\/vm\.tiktok\.com\/.+/i.test(
    url,
  );

const Edit = ( { attributes, setAttributes } ) => {
  const { url, videoId, embedHtml } = attributes;
  const [ inputUrl, setInputUrl ] = useState( url || '' );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( '' );

  const blockProps = useBlockProps( {
    className: 'turbopress-embed turbopress-embed--tiktok is-editor',
    'data-provider': 'tiktok',
    'data-state': 'preview',
  } );

  const onEmbed = async () => {
    const normalizedUrl = inputUrl.trim();

    if ( ! isValidTikTokUrl( normalizedUrl ) ) {
      setError( __( 'Use a valid TikTok URL.', 'turbopress-embed' ) );
      return;
    }

    setError( '' );
    setIsLoading( true );

    try {
      const response = await fetchData( 'tpe_get_tiktok', {
        url: normalizedUrl,
      } );

      if ( ! response?.success || ! response?.data?.embedHtml ) {
        throw new Error(
          response?.message ||
            __( 'Could not load TikTok metadata.', 'turbopress-embed' ),
        );
      }

      setAttributes( {
        url: response.data?.url || normalizedUrl,
        videoId: response.data?.videoId || '',
        title: response.data?.title || __( 'TikTok video', 'turbopress-embed' ),
        caption: response.data?.caption || response.data?.title || '',
        authorName: response.data?.authorName || '',
        authorUsername: response.data?.author?.username || '',
        authorDisplayName: response.data?.author?.displayName || '',
        authorAvatar: response.data?.author?.avatar || '',
        authorVerified: Boolean( response.data?.author?.verified ),
        hashtags: response.data?.hashtags || [],
        music: response.data?.music || {},
        thumbnailUrl: response.data?.thumbnail || '',
        embedHtml: response.data?.embedHtml || '',
      } );
    } catch ( requestError ) {
      setError( requestError.message );
    } finally {
      setIsLoading( false );
    }
  };

  const onReset = () => {
    setAttributes( {
      url: '',
      title: '',
      authorName: '',
      videoId: '',
      caption: '',
      authorUsername: '',
      authorDisplayName: '',
      authorAvatar: '',
      authorVerified: false,
      hashtags: [],
      music: {},
      thumbnailUrl: '',
      embedHtml: '',
    } );
    setInputUrl( '' );
    setError( '' );
  };

  if ( ! url || ! embedHtml ) {
    return (
      <div { ...blockProps }>
        <EmbedUrlPlaceholder
          icon="format-video"
          label={ __( 'TurboPress TikTok', 'turbopress-embed' ) }
          instructions={ __(
            'Create a lightweight TikTok preview and only load the embed on click.',
            'turbopress-embed',
          ) }
          inputLabel={ __( 'TikTok URL', 'turbopress-embed' ) }
          placeholder="https://www.tiktok.com/@username/video/..."
          inputUrl={ inputUrl }
          onInputChange={ setInputUrl }
          onSubmit={ onEmbed }
          isLoading={ isLoading }
          error={ error }
        />
      </div>
    );
  }

  return (
    <div
      { ...blockProps }
      data-embed-url={ url }
      data-video-id={ videoId }
      data-embed-html={ embedHtml }
    >
      <TikTokPreview attributes={ attributes } editor />
      <EmbedEditorActions isLoading={ isLoading } onReset={ onReset } />
      <EmbedErrorNotice error={ error } />
    </div>
  );
};

export default Edit;
