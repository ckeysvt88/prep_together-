/* Only the optional preference is stored. The tracker receives no planner data. */
(() => {
  const key = 'ready-together-analytics-opt-in';
  const button = document.getElementById('analytics-choice');
  const status = document.getElementById('analytics-status');
  let enabled = false;
  let frame;
  try { enabled = localStorage.getItem(key) === 'yes'; } catch {}

  function render() {
    button.textContent = enabled ? 'Turn off analytics' : 'Allow optional analytics';
    status.textContent = enabled ? 'Optional analytics is on.' : 'Optional analytics is off.';
    if (enabled && !frame) {
      frame = document.createElement('iframe');
      frame.title = 'Optional public visit analytics';
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.referrerPolicy = 'no-referrer';
      frame.hidden = true;
      frame.src = 'analytics.html?v=1.13';
      document.body.append(frame);
    } else if (!enabled && frame) {
      frame.remove();
      frame = undefined;
    }
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(key, enabled ? 'yes' : 'no'); } catch {}
    render();
  });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    enabled = event.newValue === 'yes';
    render();
  });
  render();
})();
