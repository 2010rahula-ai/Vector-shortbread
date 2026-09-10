// sw.js - Service Worker for Balangoda Vector Map PWA

const CACHE_NAME = "balangoda-map-v1";

// Static app shell assets and map dependencies
const STATIC_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./style.json",
  "./balangoda.pmtiles",
  "./sw.js",
  "./lib/maplibre-gl.js",
  "./lib/maplibre-gl.css",
  "./lib/pmtiles.js",
  "./images/map.png",
  "./assets/font/noto_sans_bold/0-255.pbf",
  "./assets/font/Open Sans Regular,Arial Unicode MS Regular/0-255.pbf",
  "./assets/font/Open Sans Regular,Arial Unicode MS Regular/8192-8447.pbf",
  "./assets/sprites/index.json",
  "./assets/sprites/basics/sprites.json",
  "./assets/sprites/basics/sprites.png",
  "./assets/sprites/basics/sprites@2x.json",
  "./assets/sprites/basics/sprites@2x.png",
  "./assets/sprites/basics/sprites@3x.json",
  "./assets/sprites/basics/sprites@3x.png",
  "./assets/sprites/basics/sprites@4x.json",
  "./assets/sprites/basics/sprites@4x.png",
];
// Installation: Pre-cache static assets and PMTiles file
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activation: Clean up old caches if schema updates
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Intercept network requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Handle Range Requests (required for PMTiles)
  if (request.headers.has("range")) {
    event.respondWith(handleRangeRequest(request));
    return;
  }

  // Cache-first strategy for static assets, sprites, and font glyphs
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Cache external assets dynamically (e.g., fonts, sprites, maplibre libs)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback or offline failure handling
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    }),
  );
});

// Helper function to handle HTTP Range Requests against cached files
async function handleRangeRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request.url);

  if (!cachedResponse) {
    return fetch(request);
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const rangeHeader = request.headers.get("range");
  const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);

  if (!match) {
    return new Response(arrayBuffer, {
      status: 200,
      headers: cachedResponse.headers,
    });
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : arrayBuffer.byteLength - 1;
  const slicedBuffer = arrayBuffer.slice(start, end + 1);

  return new Response(slicedBuffer, {
    status: 206,
    statusText: "Partial Content",
    headers: new Headers({
      "Content-Type":
        cachedResponse.headers.get("Content-Type") ||
        "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      "Content-Length": slicedBuffer.byteLength,
      "Accept-Ranges": "bytes",
    }),
  });
}
