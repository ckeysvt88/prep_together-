/* Cache public app files only. Private authentication data never enters the worker. */
(() => {
  const el = document.getElementById('offline-status');
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    el.textContent = 'Offline app caching is unavailable in this browser. Keep the PDF and enrolled authenticator entries for offline use.';
    return;
  }
  let settled = false;
  const pending = setTimeout(() => {
    if (!settled) el.textContent = 'Offline files are still being prepared or could not be saved. Keep this page online, then reopen and check for the offline-ready message before testing airplane mode.';
  }, 15000);
  navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' }).then(async registration => {
    const ready = await navigator.serviceWorker.ready;
    const cache = await caches.open('ready-together-public-v1.10');
    const complete = await cache.match(new URL('./offline-ready', document.baseURI).href);
    settled = true; clearTimeout(pending);
    if (complete && ready.active) el.textContent = 'App files ready for offline use on this device. Test airplane mode. Browser keys still clear on reload; keep enrolled codes in your authenticator.';
    else el.textContent = 'An app update is being prepared. Reopen online before testing offline use.';
    registration.addEventListener('updatefound', () => {
      el.textContent = 'Downloading an app update. Close all Ready Together tabs and reopen online to use the update.';
    });
  }).catch(() => {
    settled = true; clearTimeout(pending);
    el.textContent = 'Offline app files could not be saved. Reopen online and try again; keep downloaded PDFs and an enrolled authenticator as backups.';
  });
})();
