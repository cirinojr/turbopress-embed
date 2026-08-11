document.querySelectorAll( '.tpe-nextgen' ).forEach( ( root ) => {
  const copy = root.querySelector( '.tpe-nextgen__copy' );
  if ( copy ) {
    copy.addEventListener( 'click', async () => {
      const source = [ ...root.querySelectorAll( '.tpe-nextgen__line' ) ]
        .map( ( line ) => {
          const clone = line.cloneNode( true );
          clone.querySelector( 'b' )?.remove();
          return clone.textContent.replace( /\n$/, '' );
        } )
        .join( '\n' );
      try {
        await window.navigator.clipboard.writeText( source );
        const status = copy.querySelector( '[role="status"]' );
        status.textContent = copy.dataset.copiedLabel;
        window.setTimeout( () => {
          status.textContent = copy.dataset.copyLabel;
        }, 1600 );
      } catch ( error ) {
        copy.querySelector( '[role="status"]' ).textContent =
          copy.dataset.errorLabel;
      }
    } );
  }
  const play = root.querySelector( '.tpe-nextgen__play' );
  if ( play )
    play.addEventListener(
      'click',
      () => {
        if ( root.dataset.state ) return;
        const url = root.dataset.embedUrl;
        if (
          ! /^https:\/\/(?:player\.vimeo\.com|player\.twitch\.tv|clips\.twitch\.tv|codepen\.io|www\.loom\.com|www\.figma\.com)\//.test(
            url || '',
          )
        )
          return;
        root.dataset.state = 'playing';
        const iframe = document.createElement( 'iframe' );
        iframe.src = url;
        iframe.className = 'tpe-nextgen__iframe';
        iframe.title =
          play.dataset.iframeTitle ||
          play.getAttribute( 'aria-label' ) ||
          'Embedded content';
        iframe.loading = 'eager';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        if ( root.dataset.provider === 'codepen' ) {
          iframe.scrolling = 'no';
        }
        root
          .querySelector( '.tpe-nextgen__media-shell' )
          .replaceChildren( iframe );
        iframe.focus( { preventScroll: true } );
      },
      { once: true },
    );
} );
