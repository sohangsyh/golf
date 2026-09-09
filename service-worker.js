// SwingVision service worker — enables "Add to Home Screen" / installable app
// behaviour and lets the app shell open instantly (and mostly offline) after
// the first visit. The pose model + MediaPipe runtime are fetched from a CDN
// and are cached opportunistically (network-first, falling back to cache) so
// they don't need to be re-downloaded on every load, but a first run still
// needs an internet connection.

const SHELL_CACHE = "swingvision-shell-v9";
const RUNTIME_CACHE = "swingvision-runtime-v9";

// Note: the standard-*.mp4 reference clips are deliberately NOT in this list —
// they're a few MB each, and a failed/slow fetch for any one of them would
// fail cache.addAll() and block the whole app shell from installing. They're
// cached lazily on first request instead (see the fetch handler below), which
// still makes second-and-later loads fast without risking first install.
const SHELL_FILES = [
  "./",
  "./index.html",
  "./phone.html",
  "./supabase-config.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
  "./logo-header.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isSupabase = url.hostname.endsWith(".supabase.co");

  if (isSupabase) return; // never cache/intercept realtime pairing traffic

  if (isSameOrigin) {
    // app shell: cache-first, so it opens instantly and works offline. Anything
    // not precached at install (e.g. the reference video clips) gets cached
    // after its first successful fetch, so later loads are fast too.
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const resClone = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(req, resClone)).catch(() => {});
          return res;
        });
      })
    );
    return;
  }

  // cross-origin (pose model + MediaPipe CDN assets): network-first,
  // fall back to cache if offline, and cache successful responses for next time
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
