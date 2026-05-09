const CACHE_NAME = 'fincalc-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/currency.html',
  '/compare.html',
  '/currency.js',
  '/compare.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
