/* Only the app shell is cached. No voices, audio models or audio downloads. */
const CACHE_NAME='xiang-offline-system-speech-v1';
const APP_SHELL=['./','./index.html'];
self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('xiang-')).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||event.request.mode!=='navigate')return;
  const url=new URL(event.request.url);
  const base=new URL(self.registration.scope);
  if(url.origin!==base.origin)return;
  if(url.pathname!==base.pathname&&url.pathname!==base.pathname+'index.html')return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache=>{
      const saved=await cache.match('./index.html');
      if(saved)return saved;
      return fetch(event.request);
    })
  );
});
