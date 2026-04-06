const mountSoundCloudPlayer = (root) => {
  const trigger = root.querySelector('.turbopress-embed__trigger');
  const playerUrl = root.dataset.playerUrl;

  if (!trigger || !playerUrl) {
    return;
  }

  trigger.addEventListener(
    'click',
    () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'turbopress-embed__iframe';
      iframe.src = playerUrl;
      iframe.loading = 'lazy';
      iframe.title = root.querySelector('.turbopress-embed__title')?.textContent || 'SoundCloud player';
      iframe.allow = 'autoplay';

      const frameWrapper = document.createElement('div');
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.appendChild(iframe);

      root.replaceChildren(frameWrapper);
      root.classList.add('is-loaded');
    },
    { once: true }
  );
};

document.querySelectorAll('.turbopress-embed--soundcloud').forEach(mountSoundCloudPlayer);
