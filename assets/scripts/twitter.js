import loadExternalScript from './utils/loadExternalScript';

const loadTwitterWidgets = async () => {
  await loadExternalScript( {
    src: 'https://platform.twitter.com/widgets.js',
    test: () => Boolean( window.twttr?.widgets ),
  } );

  return window.twttr;
};

const mountTwitterPlayer = ( root ) => {
  const trigger = root.querySelector( '.turbopress-embed__trigger' );
  const embedHtml = root.dataset.embedHtml;

  if ( ! trigger || ! embedHtml ) {
    return;
  }

  trigger.addEventListener(
    'click',
    async () => {
      const frameWrapper = document.createElement( 'div' );
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.tabIndex = -1;
      frameWrapper.setAttribute( 'role', 'group' );
      frameWrapper.setAttribute(
        'aria-label',
        trigger.getAttribute( 'aria-label' ),
      );
      frameWrapper.innerHTML = embedHtml;

      root.replaceChildren( frameWrapper );
      root.classList.add( 'is-loaded' );
      root.setAttribute( 'aria-busy', 'true' );
      frameWrapper.focus( { preventScroll: true } );

      try {
        const twttr = await loadTwitterWidgets();
        if ( twttr?.widgets?.load ) {
          twttr.widgets.load( frameWrapper );
        }
        root.removeAttribute( 'aria-busy' );
      } catch ( error ) {
        root.classList.add( 'is-error' );
        root.removeAttribute( 'aria-busy' );
        root.dataset.tpeScriptError =
          error instanceof Error ? error.message : 'unknown_error';
      }
    },
    { once: true },
  );
};

document
  .querySelectorAll( '.turbopress-embed--twitter' )
  .forEach( mountTwitterPlayer );
