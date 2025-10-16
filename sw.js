
const CACHE_NAME = 'sbi-emi-calculator-cache-v1';
// Precaching the app shell and main libraries. Other assets will be cached on demand.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/index.tsx',
  '/App.tsx',
  '/components/AmortizationTable.tsx',
  '/components/Button.tsx',
  '/components/Input.tsx',
  '/components/PieChart.tsx',
  '/components/SummaryCard.tsx',
  '/components/InstallmentBreakdown.tsx',
  '/components/InstallPWAButton.tsx',
  '/constants.tsx',
  '/services/loanCalculator.ts',
  '/types.ts',
  // Main CDN scripts
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js',
  'https://unpkg.com/jspdf-autotable@latest/dist/jspdf.plugin.autotable.js',
  'https://unpkg.com/xlsx/dist/xlsx.full.min.js',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, then cache it for future use
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response to cache
            if(!networkResponse || event.request.method !== 'GET') {
              return networkResponse;
            }
            
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // We only cache successful responses
                if(networkResponse.status === 200) {
                    cache.put(event.request, responseToCache);
                }
              });
            
            return networkResponse;
          }
        ).catch(err => {
            console.error('Fetch failed; trying to serve from cache or offline fallback.', err);
        });
      })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});