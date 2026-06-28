/// <reference lib="webworker" />
/*
 * Service worker custom de TogoSaaS (strategie injectManifest de vite-plugin-pwa).
 *
 * - Precache des assets du build (self.__WB_MANIFEST injecte au build).
 * - Mise a jour automatique (skipWaiting + clients.claim).
 * - Gestion des notifications Web Push : evenements `push` et `notificationclick`.
 *
 * Volontairement sans dependance Workbox runtime pour rester robuste.
 * NB : ce fichier est exclu du typecheck tsc (esbuild le transpile au build).
 */

type PrecacheEntry = { url: string; revision: string | null };

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

const PRECACHE = 'togosaas-precache-v1';
// Point d'injection workbox : self.__WB_MANIFEST doit apparaitre litteralement.
const precacheUrls = (self.__WB_MANIFEST || []).map((entry) => entry.url);

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(precacheUrls))
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('togosaas-precache') && key !== PRECACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Navigation SPA : reseau d'abord, repli sur l'index precache hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || (await caches.match('/')) || Response.error();
      }),
    );
    return;
  }

  // Assets : cache d'abord, sinon reseau.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

/* ------------------------------------------------------------------ */
/* Notifications Web Push                                              */
/* ------------------------------------------------------------------ */

interface PushPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {};
  if (event.data) {
    try {
      data = event.data.json() as PushPayload;
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'TogoSaaS';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: { url: data.url || '/' },
    tag: data.tag,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && (event.notification.data as { url?: string }).url) || '/';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.focus();
            if ('navigate' in client) {
              try {
                await client.navigate(targetUrl);
              } catch {
                /* navigation cross-doc refusee : on garde le focus */
              }
            }
            return;
          }
        } catch {
          /* ignore */
        }
      }

      await self.clients.openWindow(targetUrl);
    })(),
  );
});

export {};
