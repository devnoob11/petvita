// ================================================================
// PETVITA — SERVICE WORKER
// Responsável por: cache offline, instalação como PWA
// ================================================================

const CACHE_NAME = 'petvita-v1';

// Apenas os 3 arquivos do projeto (sem pasta icons)
const ARQUIVOS_PARA_CACHE = [
  '/petvita/',
  '/petvita/index.html',
  '/petvita/manifest.json',
  '/petvita/sw.js',
];

// ----------------------------------------------------------------
// INSTALL — cacheia os arquivos essenciais
// ----------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PetVita SW] Cache inicial criado');
      return cache.addAll(ARQUIVOS_PARA_CACHE);
    })
  );
  self.skipWaiting();
});

// ----------------------------------------------------------------
// ACTIVATE — limpa caches antigos
// ----------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[PetVita SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ----------------------------------------------------------------
// FETCH — Cache First, com fallback para rede
// Para fontes externas (Google Fonts): Network First
// ----------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // Fontes do Google: tenta rede primeiro, usa cache como fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const resposta = await fetch(event.request);
          cache.put(event.request, resposta.clone());
          return resposta;
        } catch {
          return cache.match(event.request);
        }
      })
    );
    return;
  }

  // Demais recursos: Cache First
  event.respondWith(
    caches.match(event.request).then((respostaCacheada) => {
      if (respostaCacheada) return respostaCacheada;

      return fetch(event.request).then((respostaRede) => {
        if (!respostaRede || respostaRede.status !== 200) return respostaRede;
        const clone = respostaRede.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return respostaRede;
      }).catch(() => caches.match('/petvita/index.html'));
    })
  );
});
