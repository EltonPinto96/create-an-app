const CACHE_NAME = "atm-kota-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/icon.svg",
  "/manifest.json"
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Falha ao colocar alguns ficheiros estáticos em cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceção de pedidos (Network-first com fallback para cache)
self.addEventListener("fetch", (event) => {
  // Ignorar pedidos que não sejam GET e chamadas externas do Supabase / APIs
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Não interferir com pedidos a APIs e Supabase
  if (url.origin.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, clonar e atualizar a cache para ficheiros locais estáticos
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ico)$/) ||
            url.origin === self.location.origin)
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Se a rede falhar (offline), tentar responder a partir da cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Se for navegação de página HTML, retornar o root em cache
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline — sem conexão de rede", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" }),
        });
      })
  );
});
