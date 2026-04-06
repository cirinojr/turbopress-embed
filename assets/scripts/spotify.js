const getEmbedUrl = (url) => url.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/');

const mountSpotifyPlayer = (root) => {
  const trigger = root.querySelector('.turbopress-embed__trigger');
  const sourceUrl = root.dataset.embedUrl;

  if (!trigger || !sourceUrl) {
    return;
  }

  trigger.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'turbopress-embed__iframe';
    frame.src = `${getEmbedUrl(sourceUrl)}?utm_source=turbopress_embed`;
    frame.title = root.querySelector('.turbopress-embed__title')?.textContent || 'Spotify player';
    frame.loading = 'lazy';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.setAttribute('allowfullscreen', '');

    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'turbopress-embed__frame';
    frameWrapper.appendChild(frame);

    root.replaceChildren(frameWrapper);
    root.classList.add('is-loaded');
  }, { once: true });
};

document.querySelectorAll('.turbopress-embed--spotify').forEach(mountSpotifyPlayer);
