const mountYoutubePlayer = (root) => {
  const trigger = root.querySelector('.turbopress-embed__trigger');
  const videoId = root.dataset.videoId;

  if (!trigger || !videoId) {
    return;
  }

  trigger.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'turbopress-embed__iframe';
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    frame.title = root.querySelector('.turbopress-embed__title')?.textContent || 'YouTube video player';
    frame.loading = 'lazy';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;

    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'turbopress-embed__frame';
    frameWrapper.appendChild(frame);

    root.replaceChildren(frameWrapper);
    root.classList.add('is-loaded');
  }, { once: true });
};

document.querySelectorAll('.turbopress-embed--youtube').forEach(mountYoutubePlayer);

