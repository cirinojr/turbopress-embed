const createFallbackLink = ( sourceUrl ) => {
  if ( ! sourceUrl ) {
    return null;
  }

  const wrapper = document.createElement( 'p' );
  wrapper.className = 'turbopress-embed__fallback';

  const text = document.createElement( 'span' );
  text.textContent = 'Se o video nao carregar, ';

  const link = document.createElement( 'a' );
  link.className = 'turbopress-embed__fallback-link';
  link.href = sourceUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer nofollow';
  link.textContent = 'abra no TikTok';

  wrapper.append( text, link );

  return wrapper;
};

const getVideoId = ( root ) => {
  if ( /^[0-9]{10,30}$/.test( root.dataset.videoId || '' ) ) {
    return root.dataset.videoId;
  }

  return root.dataset.embedUrl?.match( /\/video\/([0-9]{10,30})/ )?.[ 1 ] || '';
};

const mountTikTokPlayer = ( root ) => {
  const trigger = root.querySelector( '.turbopress-embed__trigger' );
  const mediaWrapper = root.querySelector( '.turbopress-embed__media-wrap' );
  const embedUrl = root.dataset.embedUrl;
  const videoId = getVideoId( root );

  if ( ! trigger || ! mediaWrapper || ! videoId ) {
    return;
  }

  trigger.addEventListener(
    'click',
    () => {
      if ( root.dataset.state !== 'preview' ) {
        return;
      }

      root.dataset.state = 'loading';
      trigger.disabled = true;
      const frameWrapper = document.createElement( 'div' );
      frameWrapper.className = 'turbopress-embed__frame';
      const player = document.createElement( 'iframe' );
      player.className = 'turbopress-embed__iframe';
      player.title = trigger.getAttribute( 'aria-label' ) || 'TikTok video';
      player.allow = 'autoplay; fullscreen';
      player.allowFullscreen = true;
      const fallback = createFallbackLink( embedUrl );

      player.addEventListener(
        'load',
        () => {
          root.dataset.state = 'playing';
          root.classList.add( 'is-loaded' );
          player.focus( { preventScroll: true } );
        },
        { once: true },
      );
      player.addEventListener(
        'error',
        () => {
          root.dataset.state = 'error';
          root.classList.add( 'is-error' );
        },
        { once: true },
      );
      player.src = `https://www.tiktok.com/player/v1/${ videoId }?autoplay=1`;
      frameWrapper.appendChild( player );
      mediaWrapper.appendChild( frameWrapper );
      if ( fallback ) {
        frameWrapper.appendChild( fallback );
      }
    },
    { once: true },
  );
};

document
  .querySelectorAll( '.turbopress-embed--tiktok' )
  .forEach( mountTikTokPlayer );
