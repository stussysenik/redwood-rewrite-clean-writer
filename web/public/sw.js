// Clean Writer — Service Worker (vanilla, no Workbox)
// Strategy:
//   - Static assets (JS, CSS, HTML) → cache-first
//   - API routes (/graphql, /auth)   → network-first

const CACHE_NAME = 'clean-writer-v1';

const APP_SHELL = [
  '/',
  '/write',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll will fail silently per-entry if a URL 404s at install time,
      // so we use individual add() calls wrapped in Promise.allSettled so a
      // missing asset doesn't break the whole install.
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  // Take control immediately without waiting for old SW to vacate.
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — remove stale caches
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Claim existing clients so they use this SW straight away.
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — routing logic
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Network-first for API / auth calls.
  if (url.pathname.startsWith('/graphql') || url.pathname.startsWith('/.redwood/functions/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for auth endpoints.
  if (url.pathname.startsWith('/auth')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for everything else (static assets, pages).
  event.respondWith(cacheFirst(request));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cache-first: serve from cache; on miss, fetch → store → return.
 * Ideal for versioned static assets and the app shell.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — return a minimal offline response.
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first: try network; on failure, fall back to cache.
 * Ideal for API calls where stale data is better than nothing.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
