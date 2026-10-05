/* روضة فيرجينيا الإنجليزية — Service Worker
   يخزّن الصفحة ليعمل التطبيق بدون إنترنت.
   ملاحظة: بعد أي تعديل على الصفحة، غيّر رقم VERSION ليأخذ الزوار النسخة الجديدة. */

const VERSION = "vg-1";
const CORE = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // الخطوط وواتساب تمر كما هي

  // الصفحة نفسها: الشبكة أولاً، والنسخة المحفوظة عند انقطاع الإنترنت
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // باقي الملفات: المحفوظ أولاً لسرعة الفتح
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => hit))
  );
});
