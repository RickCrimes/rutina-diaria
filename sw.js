// ============================================================
// SERVICE WORKER — RUTINA DIARIA
// Maneja notificaciones en background y caché offline
// ============================================================

const CACHE_NAME = 'rutina-v1';
const URLS_TO_CACHE = ['./index.html', './manifest.json'];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH (offline support) ───────────────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: '🔥 Rutina', body: 'Es hora de tu próxima actividad' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'rutina',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});

// ── SCHEDULED ALARMS (via message from main thread) ──────────
// El SW recibe mensajes desde la app para programar alarmas locales
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    // Guardamos el schedule para usarlo en el alarm check
    self.SCHEDULE_DATA = e.data.schedule;
  }
  if (e.data && e.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: tag || 'rutina-alert',
      renotify: true,
      vibrate: [300, 100, 300, 100, 300],
      silent: false
    });
  }
});
