const CACHE='voice-reflex-advanced-stage-vf-v2';
const SHELL=['./','./index.html','./stage-c-data.js','./learn-data.js','./learn-ui.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(n=>n.startsWith('voice-reflex-advanced-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const path=url.pathname.slice(scope.pathname.length);
 if(event.request.mode==='navigate'){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   try{const response=await fetch(event.request);if(response.ok)cache.put('./index.html',response.clone()).catch(()=>{});return response;}
   catch(error){return await cache.match('./index.html')||Response.error();}
  }));
 }else if(SHELL.includes('./'+path)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match('./'+path);if(cached)return cached;
   try{const response=await fetch(event.request);if(response.ok)cache.put('./'+path,response.clone()).catch(()=>{});return response;}
   catch(error){return Response.error();}
  }));
 }
});