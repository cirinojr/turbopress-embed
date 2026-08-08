document.querySelectorAll( '.tpe-code-copy' ).forEach( ( button ) => {
  button.addEventListener( 'click', async () => {
    const code = button.closest( '.tpe-github-code' )?.querySelector( 'code' );
    if ( ! code || ! window.navigator.clipboard ) return;
    try {
      await window.navigator.clipboard.writeText( code.innerText );
      const original = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout( () => {
        button.textContent = original;
      }, 1600 );
    } catch ( error ) {
      button.textContent = 'Copy unavailable';
    }
  } );
} );
