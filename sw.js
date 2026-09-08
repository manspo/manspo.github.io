const CACHE_NAME = 'capsule-images-v1';

// ===== ТОЛЬКО ИЗОБРАЖЕНИЯ СЕРИЙ + ЛОГО + ABOUT =====
self.addEventListener('install', event => {
  console.log('🔧 SW: Установка');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ SW: Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ===== КЕШИРУЕМ ТОЛЬКО: =====
  // 1. Изображения из папки images/series/
  // 2. logo.webp
  // 3. about.webp
  if (url.pathname.includes('/images/series/') || 
      url.pathname === '/images/logo.webp' ||
      url.pathname === '/images/about.webp') {
    
    if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
          return cache.match(event.request).then(response => {
            if (response) {
              return response; // Из кеша
            }
            return fetch(event.request).then(fetchResponse => {
              if (fetchResponse && fetchResponse.status === 200) {
                cache.put(event.request, fetchResponse.clone());
              }
              return fetchResponse;
            }).catch(() => {
              return caches.match('/images/placeholder.svg');
            });
          });
        })
      );
      return;
    }
  }

  // ===== ВСЕ ОСТАЛЬНОЕ — С СЕРВЕРА =====
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match('/offline.html');
    })
  );
});