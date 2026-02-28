/**
 * King's Planner — Service Worker v1.0
 * 오프라인 캐시 + 백그라운드 동기화
 */

const CACHE_NAME = "kings-planner-v1.0";
const ASSETS = [
  "./index.html",
  "./manifest.json"
];

// 설치: 앱 셸 캐싱
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 구 캐시 삭제
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: 네트워크 우선 → 캐시 폴백 (앱 파일만)
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Apps Script 요청은 항상 네트워크 사용
  if (url.hostname.includes("script.google.com")) return;
  // 외부 폰트도 네트워크 우선
  if (url.hostname.includes("googleapis.com") || url.hostname.includes("gstatic.com")) return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // 성공 시 캐시 업데이트
        if (res && res.status === 200 && event.request.method === "GET") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// 푸시 알림 (향후 확장용)
self.addEventListener("push", event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "King's Planner", {
    body: data.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  });
});
