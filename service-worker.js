const CACHE_NAME = "qr-registro-cache-v20260212";

const FILES_TO_CACHE = [
  "./",
  "./index.html?v=20260212",
  "./app.js",
  "./style.css",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );

});

