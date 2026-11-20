/* Public-file allowlist. No runtime caching, messages, credentials or user data. */
'use strict';
const CACHE = 'ready-together-public-v1.16';
const BASE = new URL('./', self.location.href);
const FILES = [
  './', 'index.html', 'analytics-host.js?v=1.14', 'styles.css?v=1.12', 'manifest.webmanifest', 'sections.css?v=1.12', 'sections.js?v=1.12',
  'trusted-contact.js?v=1.10', 'trusted-contact-ui.js?v=1.10', 'vendor/qr-encoder.js?v=1.10', 'offline.js?v=1.11',
  'medical.js?v=1.9', 'medical-ui.js?v=1.9', 'planning.js?v=1.9', 'engine.js?v=1.15',
  'shopping.js?v=1.15', 'buying-guide.js?v=1.15', 'shopping-details.js?v=1.10',
  'plan-pdf.js?v=1.9', 'app.js?v=1.12', 'tour.js?v=1.12', 'vendor/pdf-lib.min.js',
  'sources.html', 'styles.css', 'Ready-Together-Beginner-Guide.pdf', 'Ready-Together-Guide.pdf',
  'icons/ready-together-32.png', 'icons/ready-together-96.png', 'icons/ready-together-180.png',
  'icons/ready-together-192.png', 'icons/ready-together-512.png', 'icons/ready-together-maskable-512.png'
].map(path => new URL(path,BASE).href);
const ALLOWED = new Set(FILES);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload',credentials:'omit'})));
  await cache.put(new URL('offline-ready',BASE).href,new Response('Public app files cached'));
  // Do not skip waiting: keep code versions consistent in existing open tabs.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys()) if(name.startsWith('ready-together-public-') && name!==CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== BASE.origin) return;
  // Never fall back for arbitrary paths/query strings or treat them as cache keys.
  const homeNavigation = event.request.mode==='navigate' && !url.search && [BASE.pathname,new URL('index.html',BASE).pathname].includes(url.pathname);
  if(homeNavigation) {
    event.respondWith(fetch(event.request).then(response=>{ if(response.ok)return response; throw new Error('App host unavailable'); }).catch(async()=>{
      const cache=await caches.open(CACHE); return await cache.match(new URL('index.html',BASE).href) || Response.error();
    }));
  } else if(ALLOWED.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache=>await cache.match(url.href) || fetch(event.request)));
  }
});
