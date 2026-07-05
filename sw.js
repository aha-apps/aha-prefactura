// sw.js — Service Worker cache-first para AHA PreFactura
var CACHE = 'aha-prefactura-v1';
var ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'core/env.js',
  'core/db.js',
  'core/crypto.js',
  'core/ui.js',
  'core/theme.js',
  'core/app.js',
  'core/search-palette.js',
  'core/file-store.js',
  'core/network.js',
  'core/sync.js',
  'core/license.js',
  'core/seed.js',
  'core/main.js',
  'modules/clientes_fiscales/module.html',
  'modules/clientes_fiscales/module.js',
  'modules/productos_fiscales/module.html',
  'modules/productos_fiscales/module.js',
  'modules/facturas/module.html',
  'modules/facturas/module.js',
  'modules/historial/module.html',
  'modules/historial/module.js',
  'modules/reportes/module.html',
  'modules/reportes/module.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(function() { return caches.match('index.html'); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function(r) { return r || fetch(req); })
  );
});
