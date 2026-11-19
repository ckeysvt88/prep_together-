const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const html = fs.readFileSync('dist/index.html', 'utf8');
const host = fs.readFileSync('dist/analytics-host.js', 'utf8');
const frame = fs.readFileSync('dist/analytics.html', 'utf8');
assert(!html.includes('<iframe'));
assert(html.includes('id="analytics-choice"'));
assert(!html.match(/Content-Security-Policy" content="([^"]+)"/)[1].includes('google'));
const handlers = {};
const button = {addEventListener: (_, fn) => { handlers.click = fn; }};
const status = {};
const frames = [];
const preference = new Map();
vm.runInNewContext(host, {
  window: {addEventListener: (name, fn) => { handlers[name] = fn; }},
  localStorage: {getItem: k => preference.get(k), setItem: (k, v) => preference.set(k, v)},
  document: {
    getElementById: id => id === 'analytics-choice' ? button : status,
    createElement: () => ({setAttribute(k, v) { this[k] = v; }, remove() { frames.splice(frames.indexOf(this), 1); }}),
    body: {append: element => frames.push(element)}
  }
});
assert.equal(frames.length, 0);
handlers.click();
assert.equal(frames.length, 1);
assert.equal(frames[0].sandbox, 'allow-scripts');
assert.equal(frames[0].referrerPolicy, 'no-referrer');
assert.equal(frames[0].src, 'analytics.html?v=1.13');
handlers.click();
assert.equal(frames.length, 0);
const script = frame.match(/<script>([\s\S]+?)<\/script>/)[1];
assert(frame.includes("'sha256-" + crypto.createHash('sha256').update(script).digest('base64') + "'"));
const inserted = [];
const window = {origin: 'null', parent: {}};
vm.runInNewContext(script, {window, crypto: crypto.webcrypto, document: {
  createElement: () => ({}), head: {append: element => inserted.push(element)}
}});
assert.equal(inserted[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-7SVFRB09B6');
const commands = window.dataLayer.map(entry => Array.from(entry));
const consent = commands.find(([command]) => command === 'consent')[2];
assert.equal(consent.analytics_storage, 'granted');
for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(consent[key], 'denied');
const config = commands.find(([command]) => command === 'config')[2];
assert.equal(config.send_page_view, false);
const events = commands.filter(([command]) => command === 'event');
assert.equal(events.length, 1);
assert.equal(events[0][1], 'page_view');
assert.equal(events[0][2].send_to, 'G-7SVFRB09B6');
assert.equal(events[0][2].page_location, 'https://readytogether.info/');
assert(!/parent\.document|top\.document|localStorage|sessionStorage|indexedDB|location\.search|location\.hash/.test(script));
assert(!fs.readFileSync('dist/sw.js', 'utf8').includes('analytics.html'));
console.log('PASS opt-in, opt-out, sandbox, tag destination and one explicit public page view');
