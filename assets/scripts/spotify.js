import { getSpotifyEmbedUrl, parseSpotifyUrl } from './spotify-url';

const mountSpotifyPlayer = ( root ) => {
  const trigger = root.querySelector( '.turbopress-embed__trigger' );
  const resource = parseSpotifyUrl( root.dataset.embedUrl || '' );

  if ( ! trigger || ! resource ) {
    return;
  }

  trigger.addEventListener(
    'click',
    () => {
      const frame = document.createElement( 'iframe' );
      frame.className = 'turbopress-embed__iframe';
      frame.src = getSpotifyEmbedUrl( resource );
      frame.title =
        root.querySelector( '.turbopress-embed__title' )?.textContent ||
        'Spotify player';
      frame.loading = 'lazy';
      frame.allow =
        'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;

      const frameWrapper = document.createElement( 'div' );
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.appendChild( frame );

      root.replaceChildren( frameWrapper );
      root.classList.add( 'is-loaded' );
      frame.focus( { preventScroll: true } );
    },
    { once: true },
  );
};

document
  .querySelectorAll( '.turbopress-embed--spotify' )
  .forEach( mountSpotifyPlayer );
