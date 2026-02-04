// Minimal Service Worker to enable PWA installability

self.addEventListener('install', (event) => {
    // Skip waiting to activate the worker immediately
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    // Claim clients to start controlling them immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network first, then fallback to cache for essential assets if needed
    // For now, just pass through to network to avoid complications with Next.js dynamic routes
    event.respondWith(fetch(event.request));
});
