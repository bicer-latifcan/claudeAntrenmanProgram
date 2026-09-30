// Uygulama modu: site bir kez açıldıktan sonra internetsiz de çalışsın.
// Önce önbellekten açar, arkada yeni sürümü indirir (bir sonraki açılışta güncel olur).
const CACHE = 'yumak-v8';
const CORE = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/app.js', './js/pixel.js', './js/yumak-art.js', './js/pet.js', './js/fx.js', './js/tarcin.js', './js/program.js', './js/bulut.js',
  './assets/favicon.svg', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
];
self.addEventListener('install', (e) => {
  // tarayıcının HTTP önbelleğini atla: yeni sürümün bütün dosyaları sunucudan ve birbiriyle uyumlu gelsin
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map((p) => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const same = u.origin === self.location.origin;
  const fonts = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!same && !fonts) return; // YouTube, bulut vb. her zaman ağdan
  const key = same ? u.origin + u.pathname : e.request; // ?v=... gibi ekler önbellekte kopya oluşturmasın
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(key);
    // arkada tazele; değişmediyse sunucu kısa bir "aynı" cevabı döner
    const req = same && e.request.mode !== 'navigate' ? new Request(e.request, { cache: 'no-cache' }) : e.request;
    const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(key, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
