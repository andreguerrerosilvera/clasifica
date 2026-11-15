/*
 * Service worker de Clasifica: el juego carga al instante y funciona sin conexión.
 *
 * - Páginas: primero la red (así siempre llega la última versión) y, sin conexión, la copia guardada.
 * - /assets (con hash), imágenes e iconos: primero la caché; no cambian nunca para la misma URL.
 * - Google Fonts: copia guardada y se refresca en segundo plano.
 * - Todo lo demás (AdSense, PostHog…) pasa directo, sin caché.
 */
const VERSION = 'v2';
const PAGES = `clasifica-pages-${VERSION}`;
const STATIC = `clasifica-static-${VERSION}`;
const FONTS = `clasifica-fonts-${VERSION}`;
const KEEP = [PAGES, STATIC, FONTS];

/** Guarda la portada y los scripts y estilos que enlaza, para jugar sin conexión desde la primera visita. */
async function precache() {
  const res = await fetch('/', { cache: 'no-cache' });
  if (!res.ok) return;
  const html = await res.clone().text();
  await (await caches.open(PAGES)).put('/', res);
  const urls = [...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css|png|webp|webmanifest))"/g)].map((m) => m[1]);
  const statics = await caches.open(STATIC);
  await Promise.all(urls.map((u) => statics.add(u).catch(() => {})));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put('/', res.clone());
    return res;
  } catch {
    return (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') return event.respondWith(networkFirst(request));
    if (url.pathname === '/sw.js' || url.pathname === '/ads.txt') return;
    if (/^\/(assets|thiings|icons)\//.test(url.pathname) || /\.(webp|png|webmanifest)$/.test(url.pathname)) {
      return event.respondWith(cacheFirst(request, STATIC));
    }
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
  }
});
