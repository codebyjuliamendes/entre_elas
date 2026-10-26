/* Cache exclusivo de recursos públicos. APIs, ações POST e páginas autenticadas nunca entram no cache. */
const CACHE = "tecida-public-v1";
const ESSENCIAIS = ["/offline", "/icon.svg", "/icon-192.png", "/icon-512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => /^(entre-elas|tecida)-public-/.test(key) && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/dev"))
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        async () => (await caches.match("/offline")) || Response.error(),
      ),
    );
    return;
  }
  const publico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/avatars/") ||
    ESSENCIAIS.includes(url.pathname);
  if (!publico) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const salvo = await cache.match(request);
      if (salvo) return salvo;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
        const chaves = await cache.keys();
        if (chaves.length > 120) {
          const extra = chaves.filter(
            (r) => !ESSENCIAIS.includes(new URL(r.url).pathname),
          );
          await Promise.all(
            extra.slice(0, chaves.length - 120).map((r) => cache.delete(r)),
          );
        }
      }
      return response;
    }),
  );
});
