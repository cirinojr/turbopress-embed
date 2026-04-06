const loadExternalScript = ({ src, test }) => {
  if (typeof test === 'function' && test()) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[src="${src}"]`);

  if (existing) {
    if (typeof test !== 'function') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      if (test()) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load failed: ${src}`));
    document.body.appendChild(script);
  });
};

export default loadExternalScript;
