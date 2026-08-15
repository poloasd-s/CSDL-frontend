// Service Worker for Thư viện CSDL Số — ĐKSKL Cần Thơ (PWA Standalone)
const CACHE_NAME = 'csdl-ct-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './script.js',
  './manifest.json'
];

// 1. Cài đặt Service Worker và lưu cache tĩnh ban đầu
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// 2. Kích hoạt và dọn dẹp các phiên bản cache cũ
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// 3. Xử lý Fetch: Network-First cho API & dynamic data, Cache-First cho static
self.addEventListener('fetch', function (event) {
  const requestUrl = new URL(event.request.url);

  // Không cache các yêu cầu API, Google Sheets, Drive, backend upload
  if (
    requestUrl.pathname.startsWith('/api') ||
    requestUrl.hostname.includes('script.google.com') ||
    requestUrl.hostname.includes('onrender.com') ||
    requestUrl.hostname.includes('googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    return; // Cho phép trình duyệt gọi trực tiếp mạng
  }

  // Chiến lược: Network-First với fallback sang Cache
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
