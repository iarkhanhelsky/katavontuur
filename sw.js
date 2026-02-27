/**
 * Service worker for Kat Avontuur PWA.
 * Caches app shell and assets for offline play.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `kat-avontuur-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js',
  '/tile-analyzer.js',
  '/tile-config.js',
  '/tile-rules.js',
  '/js/constants.js',
  '/js/state.js',
  '/js/cat.js',
  '/js/world.js',
  '/js/controls.js',
  '/js/debug.js',
  '/js/ui.js',
  '/js/game.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('kat-avontuur-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = url.hostname === 'cdn.jsdelivr.net';

  if (!sameOrigin && !isCdn) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
