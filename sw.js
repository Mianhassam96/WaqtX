'use strict';
var CACHE = 'waqtx-v11';
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './favicon.svg',
  './favicon-32.svg',
  './og-image.svg',
  './about.html',
  './contact.html',
  './privacy.html',
  './faq.html',
  './stories.html',
  './stories-data.js',
  './stories.js',
  './daily-islam.js',
  './lang/en.json',
  './lang/ur.json',
  './lang/ar.json',
  './lang/roman.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', function(e) {
  /* Force immediate activation — don't wait for old SW to die */
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function(e) {
  /* Delete ALL old caches immediately */
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      /* Take control of all open tabs immediately */
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  /* NETWORK-FIRST strategy — always try network, fall back to cache */
  /* This ensures updates are always delivered */
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        /* Cache a copy of fresh responses, including opaque cross-origin assets like CDN scripts. */
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'opaque')) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        /* Network failed — serve from cache */
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
