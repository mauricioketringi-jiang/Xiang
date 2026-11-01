const CACHE='voice-reflex-advanced-stage-d-v1';
const SHELL=['./','./index.html','./stage-c-data.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('voice-reflex-advanced-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin)return;
  const relative=url.pathname.slice(scope.pathname.length);
  if(event.request.mode==='navigate'&&(relative===''||relative==='index.html')){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      try{const response=await fetch(event.request);if(response.ok)cache.put('./index.html',response.clone()).catch(()=>{});return response;}
      catch(error){return (await cache.match('./index.html'))||Response.error();}
    }));
  } else if(relative==='stage-c-data.js'){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match('./stage-c-data.js');
      if(cached)return cached;
      try{const response=await fetch(event.request);if(response.ok)cache.put('./stage-c-data.js',response.clone()).catch(()=>{});return response;}
      catch(error){return Response.error();}
    }));
  }
});
