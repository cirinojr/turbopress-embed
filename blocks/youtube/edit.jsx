import { __, sprintf } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import fetchData from '../../assets/scripts/ajax';
import {
  EmbedEditorActions,
  EmbedErrorNotice,
  EmbedUrlPlaceholder,
} from '../shared/editor-ui';

const getYoutubeVideoId = ( url ) => {
  if ( ! url ) {
    return '';
  }

  if ( /^[a-zA-Z0-9_-]{11}$/.test( url ) ) {
    return url;
  }

  try {
    const parsed = new URL( url );
    const host = parsed.hostname.toLowerCase();
    let videoId = '';
    if ( host === 'youtu.be' || host.endsWith( '.youtu.be' ) ) {
      videoId = parsed.pathname.split( '/' ).filter( Boolean )[ 0 ] || '';
    } else if ( host === 'youtube.com' || host.endsWith( '.youtube.com' ) ) {
      if ( parsed.pathname === '/watch' ) {
        videoId = parsed.searchParams.get( 'v' ) || '';
      } else {
        const match = parsed.pathname.match( /^\/(?:shorts|embed)\/([^/]+)/ );
        videoId = match?.[ 1 ] || '';
      }
    }
    return /^[a-zA-Z0-9_-]{11}$/.test( videoId ) ? videoId : '';
  } catch ( error ) {
    return '';
  }
};

const Edit = ( { attributes, setAttributes } ) => {
  const {
    url,
    title,
    videoId,
    thumbnailUrl,
    channelName,
    channelUrl,
    channelThumbnail,
    subscriberText,
    channelVerified,
    playableInEmbed,
    showWatchButton,
    watchButtonLabel,
  } = attributes;
  const [ inputUrl, setInputUrl ] = useState( url || '' );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( '' );
  const watchLabel =
    watchButtonLabel.trim() || __( 'Watch on YouTube', 'turbopress-embed' );
  const watchUrl = url || `https://www.youtube.com/watch?v=${ videoId }`;

  const blockProps = useBlockProps( {
    className: 'turbopress-embed turbopress-embed--youtube is-editor',
    'data-provider': 'youtube',
    'data-playable-in-embed': playableInEmbed ? 'true' : 'false',
  } );

  const resolveMetadata = async ( embedUrl, parsedVideoId ) => {
    const response = await fetchData( 'tpe_get_youtube', embedUrl );

    if ( ! response?.success ) {
      throw new Error(
        response?.message ||
          __( 'Could not load YouTube metadata.', 'turbopress-embed' ),
      );
    }

    const fetchedTitle =
      response.data?.title || __( 'Untitled video', 'turbopress-embed' );
    const fetchedThumb = response.data?.thumbnail || '';

    setAttributes( {
      url: response.data?.canonicalUrl || embedUrl,
      videoId: response.data?.videoId || parsedVideoId,
      title: fetchedTitle,
      thumbnailUrl: fetchedThumb,
      channelName: response.data?.channel?.name || '',
      channelId: response.data?.channel?.id || '',
      channelUrl: response.data?.channel?.url || '',
      channelThumbnail: response.data?.channel?.thumbnail || '',
      subscriberText: response.data?.channel?.subscriberText || '',
      channelVerified: Boolean( response.data?.channel?.verified ),
      durationText: response.data?.video?.durationText || '',
      viewCountText:
        response.data?.video?.shortViewCountText ||
        response.data?.video?.viewCountText ||
        '',
      relativeDateText:
        response.data?.video?.relativeDateText ||
        response.data?.video?.dateText ||
        '',
      playableInEmbed: response.data?.video?.playableInEmbed !== false,
    } );
  };

  const onEmbed = async () => {
    const parsedVideoId = getYoutubeVideoId( inputUrl.trim() );

    if ( ! parsedVideoId ) {
      setError(
        __( 'Use a valid YouTube URL or video ID.', 'turbopress-embed' ),
      );
      return;
    }

    setError( '' );
    setIsLoading( true );

    try {
      await resolveMetadata( inputUrl.trim(), parsedVideoId );
    } catch ( requestError ) {
      setError( requestError.message );
    } finally {
      setIsLoading( false );
    }
  };

  const onReset = () => {
    setAttributes( {
      url: '',
      videoId: '',
      title: '',
      thumbnailUrl: '',
      channelName: '',
      channelId: '',
      channelUrl: '',
      channelThumbnail: '',
      subscriberText: '',
      channelVerified: false,
      durationText: '',
      viewCountText: '',
      relativeDateText: '',
      playableInEmbed: true,
    } );
    setInputUrl( '' );
    setError( '' );
  };

  if ( ! videoId ) {
    if ( isLoading ) {
      return (
        <div { ...blockProps }>
          <div className="turbopress-embed__skeleton" role="status">
            { __( 'Loading YouTube preview…', 'turbopress-embed' ) }
          </div>
        </div>
      );
    }
    return (
      <div { ...blockProps }>
        <EmbedUrlPlaceholder
          icon="video-alt3"
          label={ __( 'TurboPress YouTube', 'turbopress-embed' ) }
          instructions={ __(
            'Create a fast YouTube preview card and load the real player only on click.',
            'turbopress-embed',
          ) }
          inputLabel={ __( 'YouTube URL', 'turbopress-embed' ) }
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
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
        <PanelBody title={ __( 'YouTube', 'turbopress-embed' ) }>
          <ToggleControl
            label={ __( 'Show Watch on YouTube button', 'turbopress-embed' ) }
            checked={ showWatchButton }
            onChange={ ( value ) =>
              setAttributes( { showWatchButton: value } )
            }
          />
          <TextControl
            label={ __( 'Button label', 'turbopress-embed' ) }
            value={ watchButtonLabel }
            onChange={ ( value ) =>
              setAttributes( { watchButtonLabel: value } )
            }
            help={ __(
              'Leave empty to use the translated default.',
              'turbopress-embed',
            ) }
            disabled={ ! showWatchButton }
          />
        </PanelBody>
      </InspectorControls>
      <div { ...blockProps } data-video-id={ videoId } data-video-url={ url }>
        <div
          className="turbopress-embed__card"
          style={ {
            '--tpe-thumb-image': thumbnailUrl
              ? `url(${ thumbnailUrl })`
              : 'none',
          } }
        >
          <span className="turbopress-embed__media" aria-hidden="true" />
          <span className="turbopress-embed__overlay" aria-hidden="true" />
          <div className="turbopress-embed__top">
            { channelThumbnail &&
              ( channelUrl ? (
                <a
                  className="turbopress-embed__channel-avatar-link"
                  href={ channelUrl }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ channelName }
                  onClick={ ( event ) => event.preventDefault() }
                >
                  <img
                    className="turbopress-embed__channel-avatar"
                    src={ channelThumbnail }
                    alt=""
                    width="40"
                    height="40"
                    onError={ ( event ) => {
                      event.currentTarget.hidden = true;
                    } }
                  />
                </a>
              ) : (
                <img
                  className="turbopress-embed__channel-avatar"
                  src={ channelThumbnail }
                  alt=""
                  width="40"
                  height="40"
                  onError={ ( event ) => {
                    event.currentTarget.hidden = true;
                  } }
                />
              ) ) }
            <div className="turbopress-embed__heading">
              <span className="turbopress-embed__title" title={ title }>
                { title || __( 'YouTube video', 'turbopress-embed' ) }
              </span>
              { channelName && (
                <span className="turbopress-embed__channel-line">
                  { channelUrl ? (
                    <a
                      className="turbopress-embed__channel-name"
                      href={ channelUrl }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={ ( event ) => event.preventDefault() }
                    >
                      { channelName }
                    </a>
                  ) : (
                    <span className="turbopress-embed__channel-name">
                      { channelName }
                    </span>
                  ) }
                  { channelVerified && (
                    <span
                      className="turbopress-embed__verified"
                      aria-label={ __(
                        'Verified channel',
                        'turbopress-embed',
                      ) }
                    >
                      ✓
                    </span>
                  ) }
                  { subscriberText && (
                    <span className="turbopress-embed__subscribers">
                      { subscriberText }
                    </span>
                  ) }
                </span>
              ) }
            </div>
          </div>
          <button
            type="button"
            className="turbopress-embed__trigger"
            aria-label={ sprintf(
              // translators: %s is the YouTube video title.
              __( 'Play "%s" on YouTube', 'turbopress-embed' ),
              title || __( 'video', 'turbopress-embed' ),
            ) }
            disabled={ ! playableInEmbed }
          >
            <span className="turbopress-embed__play" aria-hidden="true">
              ▶
            </span>
          </button>
          { showWatchButton && (
            <a
              className="turbopress-embed__watch"
              href={ watchUrl }
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ `${ watchLabel }: ${ title }` }
              onClick={ ( event ) => event.preventDefault() }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M10 8.6 15.4 12 10 15.4V8.6ZM21 7.2a2.8 2.8 0 0 0-2-2C17.2 4.7 12 4.7 12 4.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 16.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.8 29 29 0 0 0-.5-4.8Z" />
              </svg>
              <span>{ watchLabel }</span>
            </a>
          ) }
        </div>
        <EmbedEditorActions isLoading={ isLoading } onReset={ onReset } />
        <EmbedErrorNotice error={ error } />
      </div>
    </>
  );
};

export default Edit;
