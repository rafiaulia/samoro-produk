/* ============================================================
   sw.js — Service Worker
   Caches app shell for offline use (PWA)
   ============================================================ */

const CACHE_NAME = 'samoro-harg-v1';

// Files to pre-cache (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/search.js',
  '/js/cache.js',
  '/js/sheet.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

// ── Install: pre-cache the app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for shell, network-only for API ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and browser-extension requests
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Network-only for Google Apps Script API calls
  if (url.hostname === 'script.google.com' || url.hostname.endsWith('.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first with network fallback for app shell
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // fallback to cache if network fails

      // Return cached immediately if available, update in background
      return cached || networkFetch;
    })
  );
});
