const BUILD = "20260212-04";
const CACHE_NAME = `qr-registro-${BUILD}`;

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./html5-qrcode.min.js",
  `./app.${BUILD}.js`
];

// 1) Install: precache + activar ya
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

// 2) Activate: claim + borrar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith("qr-registro-") && k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// 3) Fetch:
// - Navegación (HTML): Network First
// - Estáticos: Cache First
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo controlamos mismo origen (tu GitHub Pages)
  if (url.origin !== self.location.origin) return;

  // HTML principal
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        // cache: "no-store" evita el cache HTTP del navegador
        const fresh = await fetch(req, { cache: "no-store" });
        return fresh;
      } catch {
        return caches.match("./index.html");
      }
    })());
    return;
  }

  // Archivos estáticos
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});


