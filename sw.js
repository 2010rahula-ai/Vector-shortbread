const CACHE_NAME = "balangoda-vector-cache";
const ASSETS = [
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
