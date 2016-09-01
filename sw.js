var staticCacheName = 'app-train-v1';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll([
                    '/',
                    'dist/js/scripts.js',
                    'dist/css/main.css',
                    'dist/imgs/cc.svg',
                    'https://fonts.googleapis.com/css?family=Open+Sans:300'
                ])
                .then(function () {
                    self.skipWaiting();
                });
        })
    );
});

self.addEventListener('activate', function (event) {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            console.log(cacheNames);
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    console.log(cacheName);
                    return cacheName.startsWith('app-') &&
                        cacheNames != staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url),
        fetchReq = event.request.clone();
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(fetchReq);
        })
    );
});
