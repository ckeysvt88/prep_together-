const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const handlers = {}, removed = [];
let skipped = false, claimed = false, unregistered = false;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/sw.js'), 'utf8'), {
  self: {
    addEventListener: (event, fn) => handlers[event] = fn,
    skipWaiting: async () => { skipped = true; },
    clients: { claim: async () => { claimed = true; } },
    registration: { unregister: async () => { unregistered = true; } }
  },
  caches: {
    keys: async () => ['ready-together-public-v1.10', 'ready-together-public-old', 'another-app'],
    delete: async name => { removed.push(name); }
  }
});
(async () => {
  let pending;
  handlers.install({ waitUntil: promise => pending = promise }); await pending;
  assert(skipped);
  handlers.activate({ waitUntil: promise => pending = promise }); await pending;
  assert(claimed && unregistered);
  assert.deepEqual(removed, ['ready-together-public-v1.10', 'ready-together-public-old']);
  assert.equal(handlers.fetch, undefined);
  const index = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
  assert(index.includes('rollback-cleanup.js?v=auth-rollback-1'));
  assert(!index.includes('trusted-contact.js'));
  assert(index.includes('medical.js?v=1.9'));
  const cleanup = fs.readFileSync(path.join(__dirname, '../dist/rollback-cleanup.js'), 'utf8');
  assert(cleanup.includes("updateViaCache: 'none'"));
  assert(!/localStorage|sessionStorage|indexedDB|clear\(/.test(cleanup));
  console.log('PASS rollback restores the prior medical app and retires only its public offline caches');
})().catch(error => { console.error(error); process.exitCode = 1; });
