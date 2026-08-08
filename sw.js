const CACHE_NAME = 'nine-lives-heist-v6';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/heist-game.js',
  './assets/backgrounds/heist-manor.webp',
  './assets/textures/moonlit-cobble.webp',
  './assets/sprites/raccoon-guard.webp',
  './assets/sprites/loot-atlas.webp',
  './assets/animations/cat3/idle.png',
  './assets/animations/cat3/walk.png',
  './assets/animations/cat3/run.png',
  './assets/animations/cat3/jump.png',
  './assets/animations/cat3/attack.png',
  './icons/png/icon-192.png',
  './icons/png/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('nine-lives-heist-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
