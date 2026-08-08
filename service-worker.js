// Bump this version string whenever index.html/manifest/icons change. This forces
// the browser to detect service-worker.js itself changed, re-run install/activate,
// and clear out the old cache — otherwise it can keep serving a stale cached app
// indefinitely even after you upload a new index.html to GitHub.
const CACHE_NAME = 'kanishka-fleet-beta-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version first. Only fall back to
// the cached copy if the network request fails (i.e. genuinely offline). This means
// re-uploading a new index.html to GitHub takes effect immediately on next load,
// instead of silently serving a stale cached version like before.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(url.origin === location.origin){
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
