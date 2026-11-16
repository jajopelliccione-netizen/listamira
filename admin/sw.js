'use strict';
/* Service worker di Mirai: riceve le notifiche push e apre l'app quando le tocchi. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { /* messaggio non JSON */ }
  e.waitUntil(self.registration.showNotification(d.title || 'Mirai', {
    body: d.body || 'C’è una novità.',
    icon: 'icons/icon-192.png',
    data: { url: d.url || './#props' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './#props', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.startsWith(self.registration.scope));
    if (open) return open.focus().then(() => open.navigate && open.navigate(url).catch(() => {}));
    return self.clients.openWindow(url);
  }));
});
