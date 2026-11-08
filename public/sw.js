const CACHE = "derm-public-v4";
const PUBLIC = ["/offline", "/icon-192.png", "/icon-512.png", "/maskable.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("derm-public-") && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline")));
  } else if (PUBLIC.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
  }
});
