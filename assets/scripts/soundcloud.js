import {
  getSoundCloudPlayerUrl,
  normalizeSoundCloudUrl,
} from './soundcloud-url';

const mountSoundCloudPlayer = ( root ) => {
  const trigger = root.querySelector( '.turbopress-embed__trigger' );
  const resourceUrl = normalizeSoundCloudUrl( root.dataset.embedUrl || '' );

  if ( ! trigger || ! resourceUrl ) {
    return;
  }

  trigger.addEventListener(
    'click',
    () => {
      const iframe = document.createElement( 'iframe' );
      iframe.className = 'turbopress-embed__iframe';
      iframe.src = getSoundCloudPlayerUrl( resourceUrl );
      iframe.loading = 'lazy';
      const title =
        root.querySelector( '.turbopress-embed__title' )?.textContent ||
        'audio';
      iframe.title = `SoundCloud player: ${ title }`;
      iframe.allow = 'autoplay; encrypted-media';

      const frameWrapper = document.createElement( 'div' );
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.appendChild( iframe );

      root.replaceChildren( frameWrapper );
      root.classList.add( 'is-loaded' );
      iframe.focus( { preventScroll: true } );
    },
    { once: true },
  );
};

document
  .querySelectorAll( '.turbopress-embed--soundcloud' )
  .forEach( mountSoundCloudPlayer );
