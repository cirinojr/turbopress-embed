import loadExternalScript from './utils/loadExternalScript';

const loadTwitterWidgets = async () => {
  await loadExternalScript({
    src: 'https://platform.twitter.com/widgets.js',
    test: () => Boolean(globalThis.twttr?.widgets),
  });

  return globalThis.twttr;
};

const mountTwitterPlayer = (root) => {
  const trigger = root.querySelector('.turbopress-embed__trigger');
  const embedHtml = root.dataset.embedHtml;

  if (!trigger || !embedHtml) {
    return;
  }

  trigger.addEventListener(
    'click',
    async () => {
      const frameWrapper = document.createElement('div');
      frameWrapper.className = 'turbopress-embed__frame';
      frameWrapper.innerHTML = embedHtml;

      root.replaceChildren(frameWrapper);
      root.classList.add('is-loaded');

      try {
        const twttr = await loadTwitterWidgets();
        if (twttr?.widgets?.load) {
          twttr.widgets.load(frameWrapper);
        }
      } catch (error) {
        root.classList.add('is-error');
        root.dataset.tpeScriptError = error instanceof Error ? error.message : 'unknown_error';
      }
    },
    { once: true }
  );
};

document.querySelectorAll('.turbopress-embed--twitter').forEach(mountTwitterPlayer);
