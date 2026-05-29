const CACHE_NAME = 'bkk-restaurant-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-512.png'
];

// Installs service worker and caches core layout shells
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline application assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Clean older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache key:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first falling back to cache pattern for maximum up-to-date offline capabilities
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Focus only on same-origin requests or images loaded from Unsplash
  if (url.origin === self.location.origin || url.hostname.includes('unsplash.com')) {
    
    // For API calls, try network first, save to cache if successful, fallback to cache if connection is down
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(req)
          .then((res) => {
            // Put a copy of successfully loaded API response into cache for offline retrieval
            if (res.status === 200) {
              const resCopy = res.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, resCopy);
              });
            }
            return res;
          })
          .catch(() => {
            // Connection failure: serve the cached API response
            return caches.match(req).then((cachedRes) => {
              if (cachedRes) {
                return cachedRes;
              }
              // If not cached, return generic friendly JSON error response
              return new Response(JSON.stringify({ 
                error: 'You are currently offline. Displaying local data instead.', 
                offline: true 
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          })
      );
      return;
    }

    // For images, CSS, JS, and general site layout assets, use Cache First with network update
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const resCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, resCopy);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Ignore fetch error while offline
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
