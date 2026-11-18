/* Dedicated Trusted Contact rollback: retire the public offline cache only. */
'use strict';
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith('ready-together-public-')) await caches.delete(name);
  }
  await self.clients.claim();
  await self.registration.unregister();
  // No fetch handler: existing clients pass requests through to the restored app.
  // Household localStorage and enrolled authenticator entries are untouched.
})()));
