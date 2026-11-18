/* Ask previously installed clients to fetch the retirement worker immediately. */
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
    console.warn('Ready Together offline-cache cleanup could not finish. Reopen online and refresh.');
  });
})();
