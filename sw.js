const CACHE = "pwabuilder-offline-cache";
const offlineFallbackPages = ["index.html", "home.html", "quran.html", "dua.html", "calendar.html", "menu.html", "notifications.html"];

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(offlineFallbackPages)).catch(err => {
      console.error("Cache open failed during install:", err);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cache) => {
        if (cache !== CACHE) return caches.delete(cache).catch(err => console.error("Cache delete failed:", err));
      }));
    }).catch(err => console.error("Cache keys fetch failed:", err))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (error) {
        console.error("Fetch failed:", error);
        const cache = await caches.open(CACHE);
        return await cache.match("index.html") || Response.error();
      }
    })());
  }
});

self.addEventListener('push', function(event) {
  let notificationData = event.data ? event.data.json() : {};
  const options = {
    body: notificationData.body || "You have a new message!",
    icon: "/assets/icon-192.png",
    actions: [{ action: 'open_url', title: 'View' }, { action: 'dismiss', title: 'Dismiss' }],
    data: { url: notificationData.url || "/" }
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || "New Notification", options).catch(err => {
      console.error("Notification failed:", err);
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open_url') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url).catch(err => {
        console.error("Window open failed:", err);
      })
    );
  }
});