self.addEventListener("install", event => {
  console.log("[SW] Instalado");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  console.log("[SW] Ativado");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
