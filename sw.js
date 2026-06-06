// PetVita — Service Worker v3
const CACHE_NAME = 'petvita-v3';

const ARQUIVOS_PARA_CACHE = [
  '/petvita/',
  '/petvita/index.html',
  '/petvita/manifest.json',
  '/petvita/sw.js',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ARQUIVOS_PARA_CACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);

  // Fontes Google: rede primeiro
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then(async c => {
        try {
          const r = await fetch(e.request);
          c.put(e.request, r.clone());
          return r;
        } catch {
          return c.match(e.request);
        }
      })
    );
    return;
  }

  // Cache first com fallback para rede
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (!r || r.status !== 200) return r;
        caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match('/petvita/index.html'));
    })
  );
});
