const CACHE='voice-reflex-advanced-v7';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('voice-reflex-advanced-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||e.request.mode!=='navigate')return;
  const url=new URL(e.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!(url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html'))return;
  e.respondWith(caches.open(CACHE).then(async cache=>{
    try{const response=await fetch(e.request);if(response.ok)cache.put('./index.html',response.clone()).catch(()=>{});return response;}
    catch(error){return await cache.match('./index.html')||Response.error();}
  }));
});