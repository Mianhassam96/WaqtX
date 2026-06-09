'use strict';
var CACHE = 'waqtx-v12';
var ASSETS = [
  './',
  './index.html',
  './prayers.html',
  './journey.html',
  './reflection.html',
  './calendar.html',
  './profile.html',
  './settings.html',
  './qibla.html',
  './stories.html',
  './privacy.html',
  './style.css',
  './style-pages.css',
  './app.js',
  './js/core.js',
  './js/prayers.js',
  './js/journey.js',
  './js/reflection.js',
  './js/calendar.js',
  './js/profile.js',
  './js/settings.js',
  './daily-islam.js',
  './stories-data.js',
  './stories.js',
  './manifest.json',
  './favicon.svg',
  './favicon-32.svg',
  './og-image.svg',
  './lang/en.json',
  './lang/ur.json',
  './lang/ar.json',
  './lang/roman.json'
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

/* ── Prayer notification scheduling ── */
self.addEventListener('message', function(event) {
  if (!event.data || event.data.type !== 'SCHEDULE_NOTIFICATION') return;
  var prayer = event.data.prayer || 'Prayer';
  var fireAt = event.data.fireAt || 0;
  var mode   = event.data.mode   || 'adhan';
  var delay  = fireAt - Date.now();
  if (delay < 0 || delay > 86400000) return; /* ignore stale / too far */
  setTimeout(function() {
    self.registration.showNotification('WaqtX — ' + prayer, {
      body: mode === 'reminder'
        ? prayer + ' in 15 minutes. Take a moment to prepare.'
        : 'It is time for ' + prayer + '. Allahu Akbar.',
      icon: './favicon.svg',
      badge: './favicon-32.svg',
      silent: mode === 'silent',
      tag: 'prayer-' + prayer
    });
  }, delay);
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
