import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import fetchData from '../assets/scripts/ajax';
import {
  EmbedEditorActions,
  EmbedErrorNotice,
  EmbedUrlPlaceholder,
} from './shared/editor-ui';
import vimeo from './vimeo/block.json';
import gist from './github-gist/block.json';
import bluesky from './bluesky/block.json';
import twitch from './twitch/block.json';
import smartUrl from './smart-url/block.json';
import codepen from './codepen/block.json';
import loom from './loom/block.json';
import figma from './figma/block.json';

const settings = {
  'tpe/vimeo': {
    provider: 'vimeo',
    label: 'Vimeo',
    icon: 'format-video',
    action: __( 'View on Vimeo', 'turbopress-embed' ),
  },
  'tpe/github-gist': {
    provider: 'gist',
    label: 'GitHub Gist',
    icon: 'editor-code',
    action: __( 'View Gist', 'turbopress-embed' ),
  },
  'tpe/bluesky': {
    provider: 'bluesky',
    label: 'Bluesky',
    icon: 'format-status',
    action: __( 'View on Bluesky', 'turbopress-embed' ),
  },
  'tpe/twitch': {
    provider: 'twitch',
    label: 'Twitch',
    icon: 'video-alt3',
    action: __( 'Open on Twitch', 'turbopress-embed' ),
  },
  'tpe/smart-url': {
    provider: 'smart-url',
    label: 'Smart URL Preview',
    icon: 'admin-links',
    action: __( 'Open link', 'turbopress-embed' ),
  },
  'tpe/codepen': {
    provider: 'codepen',
    label: 'CodePen',
    icon: 'editor-code',
    action: __( 'Open CodePen', 'turbopress-embed' ),
  },
  'tpe/loom': {
    provider: 'loom',
    label: 'Loom',
    icon: 'video-alt2',
    action: __( 'Watch on Loom', 'turbopress-embed' ),
  },
  'tpe/figma': {
    provider: 'figma',
    label: 'Figma',
    icon: 'art',
    action: __( 'Open in Figma', 'turbopress-embed' ),
  },
};

const Preview = ( { attributes: a, config, editor = false } ) => {
  const stop = editor ? ( event ) => event.preventDefault() : undefined;
  const external = (
    <a
      className="tpe-nextgen__external"
      href={ a.url }
      target="_blank"
      rel="noopener noreferrer"
      onClick={ stop }
    >
      { config.action } <span aria-hidden="true">↗</span>
    </a>
  );
  if ( config.provider === 'gist' ) {
    const file =
      a.files?.find( ( item ) => item.name === a.selectedFile ) ||
      a.files?.[ 0 ];
    const lines = file?.content?.split( /\r?\n/ ) || [];
    return (
      <article className="tpe-nextgen__card tpe-nextgen__code">
        <header>
          <span>{ config.label }</span>
          <p className="tpe-nextgen__title">{ a.title || file?.name }</p>
          <small>
            { file?.name }
            { file?.language ? ` · ${ file.language }` : '' }
          </small>
          <button
            type="button"
            className="tpe-nextgen__copy"
            data-copy-label={ __( 'Copy code', 'turbopress-embed' ) }
            data-copied-label={ __( 'Copied', 'turbopress-embed' ) }
            data-error-label={ __( 'Copy unavailable', 'turbopress-embed' ) }
          >
            <span role="status" aria-live="polite">
              { __( 'Copy code', 'turbopress-embed' ) }
            </span>
          </button>
        </header>
        <pre>
          <code>
            { lines.map( ( line, index ) => (
              <span className="tpe-nextgen__line" key={ index }>
                <b aria-hidden="true">{ index + 1 }</b>
                { line }
                { '\n' }
              </span>
            ) ) }
          </code>
        </pre>
        <footer>
          { lines.length } { __( 'lines', 'turbopress-embed' ) }
          { external }
        </footer>
      </article>
    );
  }
  if ( config.provider === 'bluesky' )
    return (
      <article className="tpe-nextgen__card tpe-nextgen__post">
        <header>
          { a.avatar && <img src={ a.avatar } alt="" /> }
          <div>
            <p className="tpe-nextgen__title">{ a.title }</p>
            <small>@{ a.author }</small>
          </div>
        </header>
        <p>{ a.text }</p>
        { a.thumbnail && (
          <img className="tpe-nextgen__post-image" src={ a.thumbnail } alt="" />
        ) }
        <footer>
          { a.createdAt && (
            <time dateTime={ a.createdAt }>
              { new Date( a.createdAt ).toLocaleDateString() }
            </time>
          ) }
          { external }
        </footer>
      </article>
    );
  if ( config.provider === 'smart-url' )
    return (
      <article className="tpe-nextgen__card tpe-nextgen__link">
        { a.thumbnail && (
          <img className="tpe-nextgen__link-image" src={ a.thumbnail } alt="" />
        ) }
        <div>
          { a.siteName && <small>{ a.siteName }</small> }
          <p className="tpe-nextgen__title">{ a.title || a.url }</p>
          { a.description && <p>{ a.description }</p> }
          { external }
        </div>
      </article>
    );
  return (
    <article className="tpe-nextgen__card tpe-nextgen__media">
      <div className="tpe-nextgen__media-shell">
        { a.thumbnail && <img src={ a.thumbnail } alt="" /> }
        { a.embedUrl && (
          <button
            type="button"
            className="tpe-nextgen__play"
            data-iframe-title={
              config.provider === 'codepen'
                ? sprintf(
                    // translators: %s is the CodePen title or identifier.
                    __( 'CodePen preview: %s', 'turbopress-embed' ),
                    a.title || a.resourceId || config.label,
                  )
                : ''
            }
            aria-label={ sprintf(
              // translators: %s is the embedded content title.
              __( 'Play: %s', 'turbopress-embed' ),
              a.title || config.label,
            ) }
          >
            <span aria-hidden="true">▶</span>
          </button>
        ) }
      </div>
      <div className="tpe-nextgen__content">
        <small>
          { config.label } · { a.resourceType || 'embed' }
        </small>
        <p className="tpe-nextgen__title">{ a.title || config.label }</p>
        { a.author && <p>{ a.author }</p> }
        { a.description && <p>{ a.description }</p> }
        { external }
      </div>
    </article>
  );
};

const makeEdit =
  ( metadata ) =>
  ( { attributes, setAttributes } ) => {
    const config = settings[ metadata.name ];
    const [ inputUrl, setInputUrl ] = useState( attributes.url || '' );
    const [ loading, setLoading ] = useState( false );
    const [ error, setError ] = useState( '' );
    const props = useBlockProps( {
      className: `tpe-nextgen tpe-nextgen--${ config.provider }`,
      'data-provider': config.provider,
    } );
    const submit = async () => {
      setLoading( true );
      setError( '' );
      const response = await fetchData(
        `tpe_get_${ config.provider.replace( '-', '_' ) }`,
        inputUrl.trim(),
      );
      setLoading( false );
      if ( ! response?.success ) {
        setError(
          response?.data?.message ||
            response?.message ||
            __( 'Could not load preview metadata.', 'turbopress-embed' ),
        );
        return;
      }
      const d = response.data;
      setAttributes( {
        url: d.canonicalUrl || d.url || inputUrl.trim(),
        resourceType: d.type || '',
        resourceId: d.id || '',
        title: d.title || '',
        author: d.author || '',
        description: d.description || '',
        thumbnail: d.thumbnail || '',
        embedUrl: d.embedUrl || '',
        text: d.text || '',
        avatar: d.avatar || '',
        createdAt: d.createdAt || '',
        siteName: d.siteName || '',
        favicon: d.favicon || '',
        files: d.files || [],
        selectedFile: d.files?.[ 0 ]?.name || '',
      } );
    };
    if ( ! attributes.url )
      return (
        <div { ...props }>
          <EmbedUrlPlaceholder
            icon={ config.icon }
            label={ config.label }
            instructions={ __(
              'Paste a public URL to create a lightweight TurboPress preview.',
              'turbopress-embed',
            ) }
            inputLabel={ __( 'URL', 'turbopress-embed' ) }
            placeholder="https://…"
            inputUrl={ inputUrl }
            onInputChange={ setInputUrl }
            onSubmit={ submit }
            isLoading={ loading }
            error={ error }
          />
        </div>
      );
    return (
      <>
        { config.provider === 'gist' && attributes.files?.length > 1 && (
          <InspectorControls>
            <PanelBody title={ __( 'Gist file', 'turbopress-embed' ) }>
              <SelectControl
                label={ __( 'Displayed file', 'turbopress-embed' ) }
                value={ attributes.selectedFile }
                options={ attributes.files.map( ( file ) => ( {
                  label: file.name,
                  value: file.name,
                } ) ) }
                onChange={ ( selectedFile ) =>
                  setAttributes( { selectedFile } )
                }
              />
            </PanelBody>
          </InspectorControls>
        ) }
        <div { ...props } data-embed-url={ attributes.embedUrl }>
          <Preview attributes={ attributes } config={ config } editor />
          <EmbedEditorActions
            isLoading={ loading }
            onReset={ () => {
              setAttributes( { url: '' } );
              setInputUrl( '' );
            } }
          />
          <EmbedErrorNotice error={ error } />
        </div>
      </>
    );
  };

const makeSave =
  ( metadata ) =>
  ( { attributes } ) => {
    const config = settings[ metadata.name ];
    const props = useBlockProps.save( {
      className: `tpe-nextgen tpe-nextgen--${ config.provider }`,
      'data-provider': config.provider,
      'data-embed-url': attributes.embedUrl,
    } );
    return (
      <div { ...props }>
        <Preview attributes={ attributes } config={ config } />
      </div>
    );
  };

[ vimeo, gist, bluesky, twitch, smartUrl, codepen, loom, figma ].forEach(
  ( metadata ) =>
    registerBlockType( metadata.name, {
      ...metadata,
      edit: makeEdit( metadata ),
      save: makeSave( metadata ),
    } ),
);
