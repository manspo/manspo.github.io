const CACHE_NAME = 'capsule-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/catalog.html',
  '/mycollection.html',
  '/forsale.html',
  '/about.html',
  '/manufacturers.html',
  '/series.html',
  '/figure.html',
  '/offline.html',
  '/css/style.css',
  '/js/script.js',
  '/js/qrcode.min.js',
  '/manifest.json',
  '/sw.js',
  '/images/logo.webp',
  '/images/placeholder.svg',
  '/images/icon-72x72.webp',
  '/images/icon-96x96.webp',
  '/images/icon-128x128.webp',
  '/images/icon-144x144.webp',
  '/images/icon-152x152.webp',
  '/images/icon-192x192.webp',
  '/images/icon-384x384.webp',
  '/images/icon-512x512.webp',
  '/images/flags/ru.png',
  '/images/flags/en.png'
];

// ===== УСТАНОВКА =====
self.addEventListener('install', event => {
  console.log('🔧 SW: Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 SW: Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('❌ SW: Ошибка кэширования', err))
  );
  self.skipWaiting();
});

// ===== АКТИВАЦИЯ =====
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

// ===== ОБРАБОТКА ЗАПРОСОВ =====
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // ===== ИЗОБРАЖЕНИЯ С САЙТА =====
  if (url.hostname === 'manspo.github.io' && url.pathname.includes('/images/')) {
    event.respondWith(
      caches.open('images-cache').then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            return response; // Берём из кеша
          }
          return fetch(request).then(fetchResponse => {
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Если нет интернета и нет в кеше — показываем placeholder
            return caches.match('/images/placeholder.svg');
          });
        });
      })
    );
    return;
  }

  // ===== ДАННЫЕ С САЙТА (НЕ КЕШИРУЕМ) =====
  if (url.hostname === 'manspo.github.io' && url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Если нет интернета — показываем ошибку
        return new Response('Ошибка загрузки данных', { status: 503 });
      })
    );
    return;
  }

  // ===== ЛОКАЛЬНЫЕ ФАЙЛЫ ПРИЛОЖЕНИЯ =====
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response; // Берём из кеша
      }

      return fetch(request)
        .then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }

          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              // Не кешируем данные и языковые файлы с сервера
              if (!url.pathname.includes('/data/') && 
                  !url.pathname.includes('/lang/') &&
                  !url.pathname.includes('.json')) {
                cache.put(request, responseToCache);
              }
            });
          return fetchResponse;
        })
        .catch(() => {
          // Если нет интернета и нет кеша — показываем офлайн-страницу
          return caches.match('/offline.html');
        });
    })
  );
});

// ===== PUSH УВЕДОМЛЕНИЯ =====
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новое обновление в Капсуле!',
    icon: '/images/icon-192x192.webp',
    badge: '/images/icon-72x72.webp',
    vibrate: [200, 100, 200],
    data: { url: '/' }
  };
  event.waitUntil(
    self.registration.showNotification('Капсула', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});