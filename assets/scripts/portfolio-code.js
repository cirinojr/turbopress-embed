document.querySelectorAll( '.tpe-code-copy' ).forEach( ( button ) => {
  button.addEventListener( 'click', async () => {
    const code = button.closest( '.tpe-github-code' )?.querySelector( 'code' );
    if ( ! code || ! window.navigator.clipboard ) return;
    try {
      const source = [ ...code.querySelectorAll( '.tpe-code-line' ) ]
        .map( ( line ) => {
          const copy = line.cloneNode( true );
          copy.querySelector( 'b' )?.remove();
          return copy.textContent.replace( /\n$/, '' );
        } )
        .join( '\n' );
      await window.navigator.clipboard.writeText( source );
      const label = button.querySelector( '[aria-live]' );
      label.textContent = button.dataset.copiedLabel;
      window.setTimeout( () => {
        label.textContent = button.dataset.copyLabel;
      }, 1600 );
    } catch ( error ) {
      button.querySelector( '[aria-live]' ).textContent =
        button.dataset.errorLabel;
    }
  } );
} );
