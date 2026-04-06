import loadExternalScript from './utils/loadExternalScript';

const createFallbackLink = (sourceUrl) => {
  if (!sourceUrl) {
    return null;
  }

  const wrapper = document.createElement('p');
  wrapper.className = 'turbopress-embed__fallback';

  const text = document.createElement('span');
  text.textContent = 'Se o video nao carregar, ';

  const link = document.createElement('a');
  link.className = 'turbopress-embed__fallback-link';
  link.href = sourceUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer nofollow';
  link.textContent = 'abra no TikTok';

  wrapper.append(text, link);

  return wrapper;
};

const lockSwapHeight = (root) => {
  const lockedHeight = Math.ceil(root.getBoundingClientRect().height);

  if (lockedHeight > 0) {
    root.style.setProperty('--tpe-stable-height', `${lockedHeight}px`);
    root.classList.add('has-stable-height');
    root.style.height = `${lockedHeight}px`;
    root.classList.add('is-swapping');
  }

  return () => {
    root.classList.remove('is-swapping');
  };
};

const waitForIframeRender = (container, timeout = 5000) =>
  new Promise((resolve) => {
    if (container.querySelector('iframe')) {
      resolve(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (!container.querySelector('iframe')) {
        return;
      }

      observer.disconnect();
      resolve(true);
    });

    observer.observe(container, { childList: true, subtree: true });

    globalThis.setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeout);
  });

const mountTikTokPlayer = (root) => {
  const trigger = root.querySelector('.turbopress-embed__trigger');
  const embedHtml = root.dataset.embedHtml;
  const embedUrl = root.dataset.embedUrl;

  if (!trigger || !embedHtml) {
    return;
  }

  trigger.addEventListener(
    'click',
    async () => {
      const unlockSwapHeight = lockSwapHeight(root);
      const frameWrapper = document.createElement('div');
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.innerHTML = embedHtml;
      const fallback = createFallbackLink(embedUrl);

      root.replaceChildren(frameWrapper);
      if (fallback) {
        frameWrapper.appendChild(fallback);
      }

      root.classList.add('is-loaded');

      try {
        await loadExternalScript({ src: 'https://www.tiktok.com/embed.js' });
        await waitForIframeRender(frameWrapper);
      } catch (error) {
        root.classList.add('is-error');
        root.dataset.tpeScriptError = error instanceof Error ? error.message : 'unknown_error';
      } finally {
        globalThis.setTimeout(() => {
          unlockSwapHeight();
        }, 180);
      }
    },
    { once: true }
  );
};

document.querySelectorAll('.turbopress-embed--tiktok').forEach(mountTikTokPlayer);
