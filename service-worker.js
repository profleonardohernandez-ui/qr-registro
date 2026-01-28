// service-worker.js
const BUILD = "20260212-06";
const CACHE_NAME = `qr-registro-${BUILD}`;

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./app.20260212-06.js"
];

// Instalación: cachea lo esencial y activa de inmediato
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// Activación: limpia caches viejos y toma control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia: navegación network-first (para traer cambios),
// estáticos cache-first
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // navegación (HTML): intenta red primero, fallback cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // archivos estáticos: cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
