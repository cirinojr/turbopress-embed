import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { ColorPicker, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import {
  getSpotifyEmbedUrl,
  getSpotifyPublicUrl,
  parseSpotifyUrl,
} from '../../assets/scripts/spotify-url';
import {
  EmbedEditorActions,
  EmbedErrorNotice,
  EmbedUrlPlaceholder,
} from '../shared/editor-ui';

const Edit = ( { attributes, setAttributes } ) => {
  const { url, title, thumbnailUrl, backgroundColor, embedUrl } = attributes;
  const [ inputUrl, setInputUrl ] = useState( url || '' );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( '' );

  const blockProps = useBlockProps( {
    className: 'turbopress-embed turbopress-embed--spotify is-editor',
    'data-provider': 'spotify',
  } );

  const onEmbed = async () => {
    const resource = parseSpotifyUrl( inputUrl.trim() );

    if ( ! resource ) {
      setError(
        __(
          'Invalid Spotify URL. Please use a Spotify Show URL, for example: https://open.spotify.com/show/…',
          'turbopress-embed',
        ),
      );
      return;
    }

    const normalizedUrl = getSpotifyPublicUrl( resource );

    setError( '' );
    setIsLoading( true );

    try {
      const response = await fetchData( 'tpe_get_spotify', normalizedUrl );

      if ( ! response?.success ) {
        throw new Error(
          response?.message ||
            __( 'Could not load Spotify metadata.', 'turbopress-embed' ),
        );
      }

      setAttributes( {
        url: response.data?.url || normalizedUrl,
        spotifyType: response.data?.type || resource.type,
        spotifyId: response.data?.id || resource.id,
        embedUrl: response.data?.embedUrl || getSpotifyEmbedUrl( resource ),
        title:
          response.data?.title || __( 'Untitled item', 'turbopress-embed' ),
        thumbnailUrl: response.data?.thumbnail || '',
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
      thumbnailUrl: '',
      spotifyType: '',
      spotifyId: '',
      embedUrl: '',
    } );
    setInputUrl( '' );
    setError( '' );
  };

  if ( ! url ) {
    return (
      <div { ...blockProps }>
        <EmbedUrlPlaceholder
          icon="format-audio"
          label={ __( 'TurboPress Spotify', 'turbopress-embed' ) }
          instructions={ __(
            'Create a lightweight Spotify preview and only load the player after user interaction.',
            'turbopress-embed',
          ) }
          inputLabel={ __( 'Spotify URL', 'turbopress-embed' ) }
          placeholder="https://open.spotify.com/track/..."
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
    <>
      <InspectorControls>
        <PanelBody
          title={ __( 'Appearance', 'turbopress-embed' ) }
          initialOpen={ true }
        >
          <ColorPicker
            color={ backgroundColor }
            enableAlpha={ false }
            onChange={ ( value ) =>
              setAttributes( { backgroundColor: value || '#121212' } )
            }
          />
        </PanelBody>
      </InspectorControls>
      <div { ...blockProps } data-embed-url={ embedUrl || url }>
        <div
          className="turbopress-embed__card"
          style={ {
            '--tpe-spotify-bg': backgroundColor,
            '--tpe-spotify-thumb': `url(${ thumbnailUrl })`,
          } }
        >
          <button
            type="button"
            className="turbopress-embed__trigger"
            aria-label={ sprintf(
              // translators: %s is the Spotify item title.
              __( 'Open "%s" on Spotify', 'turbopress-embed' ),
              title || __( 'item', 'turbopress-embed' ),
            ) }
          >
            <span className="turbopress-embed__thumb" aria-hidden="true" />
            <span className="turbopress-embed__meta">
              <span className="turbopress-embed__provider">Spotify</span>
              <span className="turbopress-embed__title">
                { title || __( 'Spotify content', 'turbopress-embed' ) }
              </span>
              <span className="turbopress-embed__hint">
                { __( 'Click to load embedded player', 'turbopress-embed' ) }
              </span>
            </span>
            <span className="turbopress-embed__play" aria-hidden="true">
              ▶
            </span>
          </button>
        </div>
        <EmbedEditorActions isLoading={ isLoading } onReset={ onReset } />
        <EmbedErrorNotice error={ error } />
      </div>
    </>
  );
};

export default Edit;
