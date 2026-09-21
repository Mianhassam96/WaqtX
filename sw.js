'use strict';
/* ═══════════════════════════════════════════════
   WaqtX — Service Worker
   Cache: waqtx-v29
   Phase 1: Reflection UX redesign — unified flow, history, streak
   ═══════════════════════════════════════════════ */
var CACHE = 'waqtx-v29';
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
  './explore.html',
  './search.html',
  './privacy.html',
  './style.css',
  './js/core.js',
  './js/home.js',
  './js/prayers.js',
  './js/journey.js',
  './js/reflection.js',
  './js/calendar.js',
  './js/profile.js',
  './js/settings.js',
  './js/explore.js',
  './js/search.js',
  './js/history-data.js',
  './daily-islam.js',
  './stories-data.js',
  './stories.js',
  './sw-register.js',
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
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      /* Cache core assets; non-critical ones are fetched on demand */
      var core = [
        './', './index.html', './style.css',
        './js/core.js', './js/home.js', './manifest.json',
        './favicon.svg', './lang/en.json'
      ];
      return cache.addAll(core).then(function() {
        /* Cache remaining assets in background — failures are non-fatal */
        var rest = ASSETS.filter(function(a) { return core.indexOf(a) === -1; });
        return Promise.allSettled
          ? Promise.allSettled(rest.map(function(url) {
              return cache.add(url).catch(function() { /* non-fatal */ });
            }))
          : Promise.resolve();
      });
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  /* Prayer time API: network-first */
  if (url.hostname === 'api.aladhan.com' || url.hostname === 'cdn.islamic.network') {
    e.respondWith(
      fetch(e.request).catch(function() { return caches.match(e.request); })
    );
    return;
  }

  /* Google Fonts: cache-first */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  /* App assets: cache-first, fallback to network, fallback to index */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200 && url.hostname === self.location.hostname) {
          var clone = response.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
