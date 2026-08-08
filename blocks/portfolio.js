import '../assets/styles/portfolio.css';
import githubProject from './github-project/block.json';
import githubCode from './github-code/block.json';
import techStack from './tech-stack/block.json';
import caseStudy from './project-case-study/block.json';
import projectMetrics from './project-metrics/block.json';

const { registerBlockType } = wp.blocks;
const { InspectorControls, RichText, useBlockProps } = wp.blockEditor;
const {
  Button,
  PanelBody,
  SelectControl,
  TextControl,
  TextareaControl,
  ToggleControl,
  RangeControl,
} = wp.components;
const { Fragment, useEffect, useState } = wp.element;

const safePublicUrl = ( value ) => {
  try {
    const url = new URL( value );
    return [ 'http:', 'https:' ].includes( url.protocol ) ? url.href : '';
  } catch {
    return '';
  }
};

const openDatabase = () =>
  new Promise( ( resolve, reject ) => {
    if ( ! window.indexedDB )
      return reject( new Error( 'IndexedDB unavailable' ) );
    const request = window.indexedDB.open( 'turbopress-embed', 1 );
    request.onupgradeneeded = () =>
      request.result.createObjectStore( 'remote' );
    request.onsuccess = () => resolve( request.result );
    request.onerror = () => reject( request.error );
  } );

const localCache = {
  async get( key ) {
    try {
      const db = await openDatabase();
      return await new Promise( ( resolve ) => {
        const request = db
          .transaction( 'remote' )
          .objectStore( 'remote' )
          .get( key );
        request.onsuccess = () => resolve( request.result || null );
        request.onerror = () => resolve( null );
      } );
    } catch ( error ) {
      return null;
    }
  },
  async set( key, value ) {
    try {
      const db = await openDatabase();
      db.transaction( 'remote', 'readwrite' )
        .objectStore( 'remote' )
        .put( value, key );
    } catch ( error ) {
      /* Memory-only behavior is acceptable when IndexedDB is blocked. */
    }
  },
};

const pending = new Map();
const requestRemote = ( resource, params, refresh = false, etag = '' ) => {
  const query = new URLSearchParams( {
    ...params,
    ...( refresh ? { refresh: '1' } : {} ),
  } );
  const key = `${ resource }:${ query }`;
  if ( pending.has( key ) ) return pending.get( key );
  const headers = { 'X-WP-Nonce': window.turbopressPortfolio.nonce };
  if ( etag ) headers[ 'If-None-Match' ] = `"${ etag }"`;
  const promise = fetch(
    `${ window.turbopressPortfolio.restUrl }github/${ resource }?${ query }`,
    {
      credentials: 'same-origin',
      headers,
    },
  )
    .then( async ( response ) => {
      if ( response.status === 304 ) return { notModified: true, etag };
      if ( ! response.ok )
        throw new Error(
          ( await response.json() )?.message || 'Remote data unavailable',
        );
      return {
        payload: await response.json(),
        etag: ( response.headers.get( 'ETag' ) || '' ).replaceAll( '"', '' ),
      };
    } )
    .finally( () => pending.delete( key ) );
  pending.set( key, promise );
  return promise;
};

const useRemote = ( resource, params, enabled ) => {
  const key = `${ resource }:${ JSON.stringify( params ) }`;
  const [ state, setState ] = useState( {
    data: null,
    loading: enabled,
    checking: false,
    error: '',
  } );
  const load = async ( force = false ) => {
    if ( ! enabled ) return;
    const cached = await localCache.get( key );
    const now = Date.now();
    if ( cached?.payload )
      setState( {
        data: cached.payload,
        loading: false,
        checking: cached.revalidateAt <= now,
        error: '',
      } );
    if ( ! force && cached?.revalidateAt > now ) return;
    try {
      const result = await requestRemote(
        resource,
        params,
        force,
        cached?.etag || '',
      );
      const data = result.notModified ? cached.payload : result.payload;
      await localCache.set( key, {
        payload: data,
        etag: result.etag || cached?.etag || '',
        revalidateAt: now + 5 * 60 * 1000,
        staleUntil: now + 7 * 86400000,
      } );
      setState( { data, loading: false, checking: false, error: '' } );
    } catch ( error ) {
      setState( ( current ) => ( {
        ...current,
        loading: false,
        checking: false,
        error: current.data ? '' : error.message,
      } ) );
    }
  };
  useEffect( () => {
    load();
    // The serialized key captures every request parameter used by load().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ key, enabled ] );
  return { ...state, refresh: () => load( true ) };
};

const Field = ( { label, value, onChange, area = false } ) =>
  area ? (
    <TextareaControl
      label={ label }
      value={ value || '' }
      onChange={ onChange }
    />
  ) : (
    <TextControl label={ label } value={ value || '' } onChange={ onChange } />
  );

const AppearanceControls = ( { attributes, setAttributes } ) => (
  <Fragment>
    <SelectControl
      label="Theme"
      value={ attributes.theme || 'auto' }
      options={ [ 'auto', 'light', 'dark' ].map( ( value ) => ( {
        label: value[ 0 ].toUpperCase() + value.slice( 1 ),
        value,
      } ) ) }
      onChange={ ( theme ) => setAttributes( { theme } ) }
    />
    <SelectControl
      label="Density"
      value={ attributes.density || 'comfortable' }
      options={ [
        { label: 'Comfortable', value: 'comfortable' },
        { label: 'Compact', value: 'compact' },
      ] }
      onChange={ ( density ) => setAttributes( { density } ) }
    />
  </Fragment>
);

const designClass = ( a, block ) =>
  `tpe-developer ${ block } is-theme-${ a.theme || 'auto' } is-density-${
    a.density || 'comfortable'
  } is-layout-${ a.layout || 'default' }`;

const RemoteState = ( { state } ) => (
  <Fragment>
    { state.loading && ! state.data && (
      <div className="tpe-skeleton" role="status">
        Loading preview…
      </div>
    ) }
    { state.checking && state.data && (
      <small className="tpe-checking">Checking for updates…</small>
    ) }
    { state.error && ! state.data && (
      <div className="tpe-error" role="alert">
        <strong>Content unavailable</strong>
        <p>We couldn’t load this content right now.</p>
        <Button variant="secondary" onClick={ state.refresh }>
          Retry
        </Button>
      </div>
    ) }
  </Fragment>
);

const GithubProjectEdit = ( { attributes: a, setAttributes: set } ) => {
  const state = useRemote(
    'repository',
    { url: a.repositoryUrl },
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test( a.repositoryUrl ),
  );
  const d = state.data;
  return (
    <div
      { ...useBlockProps( {
        className: designClass( a, 'tpe-github-project' ),
      } ) }
    >
      <InspectorControls>
        <PanelBody title="Project settings">
          <AppearanceControls attributes={ a } setAttributes={ set } />
          <Field
            label="Custom title"
            value={ a.customTitle }
            onChange={ ( v ) => set( { customTitle: v } ) }
          />
          <Field
            area
            label="Custom description"
            value={ a.customDescription }
            onChange={ ( v ) => set( { customDescription: v } ) }
          />
          <Field
            label="Custom demo URL"
            value={ a.demoUrl }
            onChange={ ( v ) => set( { demoUrl: v } ) }
          />
          <SelectControl
            label="Layout"
            value={ a.layout }
            options={ [ 'minimal', 'card', 'developer' ].map( ( v ) => ( {
              label: v,
              value: v,
            } ) ) }
            onChange={ ( v ) => set( { layout: v } ) }
          />
          { [
            'Stars',
            'Forks',
            'Language',
            'Topics',
            'License',
            'UpdatedDate',
            'RepositoryButton',
            'DemoButton',
          ].map( ( name ) => (
            <ToggleControl
              key={ name }
              label={ `Show ${ name
                .replace( /([A-Z])/g, ' $1' )
                .toLowerCase() }` }
              checked={ a[ `show${ name }` ] }
              onChange={ ( v ) => set( { [ `show${ name }` ]: v } ) }
            />
          ) ) }
        </PanelBody>
      </InspectorControls>
      { ! d && (
        <Field
          label="GitHub repository URL"
          value={ a.repositoryUrl }
          onChange={ ( v ) => set( { repositoryUrl: v.trim() } ) }
        />
      ) }
      <RemoteState state={ state } />
      { d && (
        <Fragment>
          <h3>{ a.customTitle || d.name }</h3>
          <p>{ a.customDescription || d.description }</p>
          <ul className="tpe-meta">
            { a.showLanguage && d.language && <li>{ d.language }</li> }
            { a.showStars && <li>{ d.stars } stars</li> }
            { a.showForks && <li>{ d.forks } forks</li> }
            { a.showLicense && d.license && <li>{ d.license }</li> }
          </ul>
          { a.showTopics && (
            <p className="tpe-topics">
              { d.topics.map( ( x ) => (
                <span key={ x }>{ x }</span>
              ) ) }
            </p>
          ) }
          <Button variant="secondary" onClick={ state.refresh }>
            Refresh now
          </Button>
        </Fragment>
      ) }
    </div>
  );
};

const GithubCodeEdit = ( { attributes: a, setAttributes: set } ) => {
  const ready = Boolean( a.repositoryUrl && a.filePath );
  const state = useRemote(
    'file',
    { url: a.repositoryUrl, branch: a.branch, path: a.filePath },
    ready,
  );
  const lines =
    state.data?.content
      ?.split( /\r?\n/ )
      .slice(
        Math.max( 0, a.startLine - 1 ),
        Math.min( a.endLine, a.startLine + 199 ),
      ) || [];
  const highlighted = new Set(
    ( a.highlightedLines || '' )
      .split( ',' )
      .map( ( v ) => Number.parseInt( v.trim(), 10 ) )
      .filter( Number.isFinite ),
  );
  return (
    <div
      { ...useBlockProps( { className: designClass( a, 'tpe-github-code' ) } ) }
    >
      <InspectorControls>
        <PanelBody title="Code settings">
          <AppearanceControls attributes={ a } setAttributes={ set } />
          <Field
            label="Branch (optional)"
            value={ a.branch }
            onChange={ ( v ) => set( { branch: v } ) }
          />
          <RangeControl
            label="Start line"
            min={ 1 }
            max={ 9999 }
            value={ a.startLine }
            onChange={ ( v ) => set( { startLine: v } ) }
          />
          <RangeControl
            label="End line"
            min={ a.startLine }
            max={ Math.min( 9999, a.startLine + 199 ) }
            value={ a.endLine }
            onChange={ ( v ) => set( { endLine: v } ) }
          />
          <Field
            label="Highlighted lines"
            value={ a.highlightedLines }
            onChange={ ( v ) => set( { highlightedLines: v } ) }
          />
          <ToggleControl
            label="Show filename"
            checked={ a.showFilename }
            onChange={ ( v ) => set( { showFilename: v } ) }
          />
          <ToggleControl
            label="Show line numbers"
            checked={ a.showLineNumbers }
            onChange={ ( v ) => set( { showLineNumbers: v } ) }
          />
          <ToggleControl
            label="Show GitHub link"
            checked={ a.showGithubLink }
            onChange={ ( v ) => set( { showGithubLink: v } ) }
          />
          <RangeControl
            label="Maximum height"
            min={ 160 }
            max={ 1000 }
            value={ a.maxHeight }
            onChange={ ( v ) => set( { maxHeight: v } ) }
          />
        </PanelBody>
      </InspectorControls>
      <Field
        label="GitHub repository URL"
        value={ a.repositoryUrl }
        onChange={ ( v ) => set( { repositoryUrl: v.trim() } ) }
      />
      <Field
        label="File path"
        value={ a.filePath }
        onChange={ ( v ) => set( { filePath: v } ) }
      />
      <Field
        label="Title"
        value={ a.title }
        onChange={ ( v ) => set( { title: v } ) }
      />
      <Field
        area
        label="Description"
        value={ a.description }
        onChange={ ( v ) => set( { description: v } ) }
      />
      <RemoteState state={ state } />
      { state.data && (
        <Fragment>
          <div className="tpe-code-header">
            { a.showFilename && <strong>{ state.data.path }</strong> }
            <Button
              className="tpe-code-copy"
              aria-live="polite"
              onClick={ () =>
                window.navigator.clipboard?.writeText( lines.join( '\n' ) )
              }
            >
              Copy code
            </Button>
          </div>
          <pre style={ { maxHeight: a.maxHeight } }>
            <code>
              { lines.map( ( line, i ) => {
                const number = a.startLine + i;
                return (
                  <span
                    className={ `tpe-code-line${
                      highlighted.has( number ) ? ' is-highlighted' : ''
                    }` }
                    key={ i }
                  >
                    { a.showLineNumbers && <b>{ number }</b> }
                    { line }
                    { '\n' }
                  </span>
                );
              } ) }
            </code>
          </pre>
          <Button variant="secondary" onClick={ state.refresh }>
            Refresh now
          </Button>
        </Fragment>
      ) }
    </div>
  );
};

const TechnologyEditor = ( { items, onChange } ) => (
  <div>
    { items.map( ( item, index ) => (
      <div className="tpe-row" key={ index }>
        <TextControl
          label="Name"
          value={ item.name || '' }
          onChange={ ( v ) =>
            onChange(
              items.map( ( x, i ) => ( i === index ? { ...x, name: v } : x ) ),
            )
          }
        />
        <TextControl
          label="URL"
          value={ item.url || '' }
          onChange={ ( v ) =>
            onChange(
              items.map( ( x, i ) => ( i === index ? { ...x, url: v } : x ) ),
            )
          }
        />
        <TextControl
          label="Category"
          value={ item.category || '' }
          onChange={ ( v ) =>
            onChange(
              items.map( ( x, i ) =>
                i === index ? { ...x, category: v } : x,
              ),
            )
          }
        />
        <Button
          disabled={ ! index }
          onClick={ () => {
            const n = [ ...items ];
            [ n[ index - 1 ], n[ index ] ] = [ n[ index ], n[ index - 1 ] ];
            onChange( n );
          } }
        >
          Up
        </Button>
        <Button
          disabled={ index === items.length - 1 }
          onClick={ () => {
            const n = [ ...items ];
            [ n[ index + 1 ], n[ index ] ] = [ n[ index ], n[ index + 1 ] ];
            onChange( n );
          } }
        >
          Down
        </Button>
        <Button
          isDestructive
          onClick={ () => onChange( items.filter( ( x, i ) => i !== index ) ) }
        >
          Remove
        </Button>
      </div>
    ) ) }
  </div>
);

const TechStackView = ( { a, items } ) => (
  <div className={ designClass( a, 'tpe-tech-stack' ) }>
    <ul>
      { items.map( ( item, i ) => (
        <li key={ `${ item.name }-${ i }` }>
          { safePublicUrl( item.url ) ? (
            <a href={ safePublicUrl( item.url ) }>{ item.name }</a>
          ) : (
            <span>{ item.name }</span>
          ) }
          { a.showPercentages && item.percentage !== undefined && (
            <small> { item.percentage }%</small>
          ) }
          { item.category && <small> { item.category }</small> }
        </li>
      ) ) }
    </ul>
  </div>
);
const TechStackEdit = ( { attributes: a, setAttributes: set } ) => {
  const state = useRemote(
    'languages',
    { url: a.repositoryUrl },
    a.mode === 'github' && Boolean( a.repositoryUrl ),
  );
  const items =
    a.mode === 'github'
      ? ( state.data || [] ).slice( 0, a.maxLanguages )
      : a.technologies;
  return (
    <div { ...useBlockProps() }>
      <InspectorControls>
        <PanelBody title="Stack settings">
          <AppearanceControls attributes={ a } setAttributes={ set } />
          <SelectControl
            label="Mode"
            value={ a.mode }
            options={ [
              { label: 'Manual', value: 'manual' },
              { label: 'GitHub', value: 'github' },
            ] }
            onChange={ ( v ) => set( { mode: v } ) }
          />
          <SelectControl
            label="Layout"
            value={ a.layout }
            options={ [ 'badges', 'inline', 'detailed' ].map( ( v ) => ( {
              label: v,
              value: v,
            } ) ) }
            onChange={ ( v ) => set( { layout: v } ) }
          />
          <ToggleControl
            label="Show percentages"
            checked={ a.showPercentages }
            onChange={ ( v ) => set( { showPercentages: v } ) }
          />
          <RangeControl
            label="Maximum languages"
            min={ 1 }
            max={ 20 }
            value={ a.maxLanguages }
            onChange={ ( v ) => set( { maxLanguages: v } ) }
          />
        </PanelBody>
      </InspectorControls>
      { a.mode === 'github' ? (
        <Fragment>
          <Field
            label="GitHub repository URL"
            value={ a.repositoryUrl }
            onChange={ ( v ) => set( { repositoryUrl: v.trim() } ) }
          />
          <RemoteState state={ state } />
        </Fragment>
      ) : (
        <Fragment>
          <TechnologyEditor
            items={ a.technologies }
            onChange={ ( v ) => set( { technologies: v } ) }
          />
          <Button
            variant="secondary"
            onClick={ () =>
              set( {
                technologies: [
                  ...a.technologies,
                  { name: '', url: '', category: '' },
                ],
              } )
            }
          >
            Add technology
          </Button>
        </Fragment>
      ) }
      <TechStackView a={ a } items={ items } />
    </div>
  );
};

const CaseStudyView = ( { a, editing = false, set } ) => (
  <article className={ designClass( a, 'tpe-case-study' ) }>
    { safePublicUrl( a.featuredImageUrl ) && (
      <img src={ safePublicUrl( a.featuredImageUrl ) } alt="" />
    ) }
    { editing ? (
      <Fragment>
        <RichText
          tagName="h2"
          placeholder="Project title"
          value={ a.projectTitle }
          onChange={ ( v ) => set( { projectTitle: v } ) }
        />
        <RichText
          tagName="p"
          placeholder="Short summary"
          value={ a.summary }
          onChange={ ( v ) => set( { summary: v } ) }
        />
        { [ 'challenge', 'solution', 'result' ].map( ( x ) => (
          <section key={ x }>
            <h3>{ x[ 0 ].toUpperCase() + x.slice( 1 ) }</h3>
            <RichText
              tagName="p"
              placeholder={ `Describe the ${ x }` }
              value={ a[ x ] }
              onChange={ ( v ) => set( { [ x ]: v } ) }
            />
          </section>
        ) ) }
      </Fragment>
    ) : (
      <Fragment>
        { a.projectTitle && (
          <RichText.Content tagName="h2" value={ a.projectTitle } />
        ) }{ ' ' }
        { a.summary && <RichText.Content tagName="p" value={ a.summary } /> }{ ' ' }
        { [ 'challenge', 'solution', 'result' ].map(
          ( x ) =>
            a[ x ] && (
              <section key={ x }>
                <h3>{ x[ 0 ].toUpperCase() + x.slice( 1 ) }</h3>
                <RichText.Content tagName="p" value={ a[ x ] } />
              </section>
            ),
        ) }
      </Fragment>
    ) }
    { a.role && (
      <p>
        <strong>Role:</strong> { a.role }
      </p>
    ) }
    { a.company && (
      <p>
        <strong>Company/client:</strong> { a.company }
      </p>
    ) }
    { a.date && <time>{ a.date }</time> }
    { a.technologies?.length > 0 && (
      <TechStackView
        a={ {
          layout: 'badges',
          showPercentages: false,
          theme: a.theme,
          density: a.density,
        } }
        items={ a.technologies }
      />
    ) }
  </article>
);
const CaseStudyEdit = ( { attributes: a, setAttributes: set } ) => (
  <div { ...useBlockProps() }>
    <InspectorControls>
      <PanelBody title="Case study details">
        <AppearanceControls attributes={ a } setAttributes={ set } />
        { [
          'role',
          'company',
          'date',
          'projectUrl',
          'repositoryUrl',
          'featuredImageUrl',
        ].map( ( x ) => (
          <Field
            key={ x }
            label={ x.replace( /([A-Z])/g, ' $1' ) }
            value={ a[ x ] }
            onChange={ ( v ) => set( { [ x ]: v } ) }
          />
        ) ) }
        <SelectControl
          label="Layout"
          value={ a.layout }
          options={ [ 'compact', 'case-study', 'recruiter' ].map( ( v ) => ( {
            label: v,
            value: v,
          } ) ) }
          onChange={ ( v ) => set( { layout: v } ) }
        />
      </PanelBody>
    </InspectorControls>
    <CaseStudyView a={ a } editing set={ set } />
    <TechnologyEditor
      items={ a.technologies }
      onChange={ ( v ) => set( { technologies: v } ) }
    />
    <Button
      variant="secondary"
      onClick={ () =>
        set( {
          technologies: [
            ...a.technologies,
            { name: '', url: '', category: '' },
          ],
        } )
      }
    >
      Add technology
    </Button>
  </div>
);

const MetricsView = ( { a } ) => (
  <div className={ designClass( a, 'tpe-project-metrics' ) }>
    { a.metrics.map( ( m, i ) => (
      <article key={ i }>
        <h3>{ m.label }</h3>
        <p>
          { ! a.hideBefore && m.before && (
            <Fragment>
              <span>
                { m.before }
                { m.unit }
              </span>
              <span aria-hidden="true"> → </span>
            </Fragment>
          ) }
          <strong>
            { m.after }
            { m.unit }
          </strong>
        </p>
        { m.direction && m.direction !== 'neutral' && (
          <small>
            { m.direction === 'higher-is-better'
              ? 'Higher is better'
              : 'Lower is better' }
          </small>
        ) }
        { m.description && <p>{ m.description }</p> }
      </article>
    ) ) }
  </div>
);
const MetricsEdit = ( { attributes: a, setAttributes: set } ) => {
  const update = ( i, k, v ) =>
    set( {
      metrics: a.metrics.map( ( m, x ) =>
        x === i ? { ...m, [ k ]: v } : m,
      ),
    } );
  return (
    <div { ...useBlockProps() }>
      <InspectorControls>
        <PanelBody title="Metrics settings">
          <AppearanceControls attributes={ a } setAttributes={ set } />
          <SelectControl
            label="Layout"
            value={ a.layout }
            options={ [ 'metrics-grid', 'before-after', 'compact' ].map(
              ( v ) => ( {
                label: v,
                value: v,
              } ),
            ) }
            onChange={ ( v ) => set( { layout: v } ) }
          />
          <ToggleControl
            label="Hide before values"
            checked={ a.hideBefore }
            onChange={ ( v ) => set( { hideBefore: v } ) }
          />
          <ToggleControl
            label="Automatic calculation"
            checked={ a.autoCalculate }
            onChange={ ( v ) => set( { autoCalculate: v } ) }
          />
        </PanelBody>
      </InspectorControls>
      { a.metrics.map( ( m, i ) => (
        <div className="tpe-row" key={ i }>
          { [ 'label', 'before', 'after', 'unit', 'description' ].map(
            ( k ) => (
              <Field
                key={ k }
                label={ k }
                value={ m[ k ] }
                onChange={ ( v ) => update( i, k, v ) }
              />
            ),
          ) }
          <SelectControl
            label="Direction"
            value={ m.direction || 'neutral' }
            options={ [ 'higher-is-better', 'lower-is-better', 'neutral' ].map(
              ( v ) => ( { label: v, value: v } ),
            ) }
            onChange={ ( v ) => update( i, 'direction', v ) }
          />
          <Button
            disabled={ ! i }
            onClick={ () => {
              const n = [ ...a.metrics ];
              [ n[ i - 1 ], n[ i ] ] = [ n[ i ], n[ i - 1 ] ];
              set( { metrics: n } );
            } }
          >
            Up
          </Button>
          <Button
            isDestructive
            onClick={ () =>
              set( { metrics: a.metrics.filter( ( x, j ) => j !== i ) } )
            }
          >
            Remove
          </Button>
        </div>
      ) ) }
      <Button
        variant="secondary"
        onClick={ () =>
          set( {
            metrics: [
              ...a.metrics,
              {
                label: '',
                before: '',
                after: '',
                unit: '',
                description: '',
                direction: 'neutral',
              },
            ],
          } )
        }
      >
        Add metric
      </Button>
      <MetricsView a={ a } />
    </div>
  );
};

registerBlockType( githubProject, {
  edit: GithubProjectEdit,
  save: () => null,
} );
registerBlockType( githubCode, { edit: GithubCodeEdit, save: () => null } );
registerBlockType( techStack, {
  edit: TechStackEdit,
  save: ( { attributes: a } ) =>
    a.mode === 'manual' ? (
      <TechStackView a={ a } items={ a.technologies } />
    ) : null,
} );
registerBlockType( caseStudy, {
  edit: CaseStudyEdit,
  save: ( { attributes: a } ) => <CaseStudyView a={ a } />,
} );
registerBlockType( projectMetrics, {
  edit: MetricsEdit,
  save: ( { attributes: a } ) => <MetricsView a={ a } />,
} );
