// Minimal service worker — just enables PWA installability
// Does not cache anything to avoid breaking the app

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// Pass all requests through to the network
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
