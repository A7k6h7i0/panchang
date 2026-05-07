const APP_SHELL_CACHE = "panchang-shell-v1";
const RUNTIME_CACHE = "panchang-runtime-v1";
const API_CACHE = "panchang-api-v1";

const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
  "/backgroundImage.png",
  "/RingBell-192.png",
  "/RingBell-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = url.pathname.startsWith("/api/");

  // SPA navigation: network-first with offline fallback to cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/index.html");
        })
    );
    return;
  }

  // API GET requests: network-first, fallback to cache.
  if (isApiRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

// Keep notification support.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "SCHEDULE_NOTIFICATION") return;
  const { title, body, timestamp } = event.data;
  const delay = Number(timestamp) - Date.now();
  if (delay <= 0) return;

  setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: "/RingBell-192.png",
      badge: "/RingBell-192.png",
      vibrate: [200, 100, 200],
      tag: "panchang-notification",
      requireInteraction: true,
    });
  }, delay);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
