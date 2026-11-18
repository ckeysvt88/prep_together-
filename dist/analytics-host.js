/* One-way public load diagnostic; never send planner data to the analytics frame. */
window.addEventListener('message', event => {
  const frame = document.getElementById('ready-analytics');
  if (!frame || event.source !== frame.contentWindow || event.origin !== 'null') return;
  if (event.data === 'ready-together-gtm-loaded') frame.dataset.status = 'loaded';
  if (event.data === 'ready-together-gtm-unavailable') frame.dataset.status = 'unavailable';
});
