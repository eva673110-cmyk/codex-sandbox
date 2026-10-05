const CACHE='water-balance-v3';
const assets=['./','./index.html','./style.css','./app.js','./model.js','./data.js','./cloud.js','./config.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(assets))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('water-balance-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));return;}
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&assets.some(asset=>new URL(asset,self.location.href).pathname===url.pathname)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(()=>caches.match(event.request)));
});
