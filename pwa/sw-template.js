// Offline play (2026-10-25). The build (vite.config.ts, offlinePlugin) fills in PRECACHE (every file of the
// site: the game's code, styles, fonts, flags, icons) and VERSION. On the first visit the browser keeps a copy of
// all of it, so after that the game opens and plays with no connection, at the same address and with the same
// saves (those live in the browser's IndexedDB, not here).
//  • The page itself: the newest from the network when online, the kept copy when not.
//  • Everything else: the kept copy first (each build's files have their own names, so a copy is never stale).
//  • A new version installs in the background the next time you're online and takes over on the next visit; the
//    previous version's files are kept one more round so a game already open can still load its screens.
const VERSION = self.__VERSION__;
const PRECACHE = self.__PRECACHE__;
const CACHE = 'bm-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = (await caches.keys()).filter(k => k.startsWith('bm-') && k !== CACHE);
    const meta = await caches.open('bm-meta'), prev = await meta.match('prev').then(r => (r ? r.text() : null));
    await Promise.all(keys.filter(k => k !== prev && k !== 'bm-meta').map(k => caches.delete(k)));
    await meta.put('prev', new Response(CACHE));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
