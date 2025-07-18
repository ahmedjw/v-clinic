// This is a basic service worker for a PWA.
// In a real application, you might use Workbox for more advanced caching strategies.

const CACHE_NAME = "virtual-clinic-cache-v1"
const urlsToCache = [
  "/",
  "/login",
  "/register",
  "/share-appointment",
  "/globals.css",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon.ico",
  "/install-prompt.html",
  // Add other static assets your app needs offline
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      // No cache hit - fetch from network
      return fetch(event.request).catch(() => {
        // If network fails, and it's a navigation request,
        // serve a fallback page (e.g., your index.html or a custom offline page)
        if (event.request.mode === "navigate") {
          return caches.match("/") // Serve the root page as a fallback
        }
        // For other requests (e.g., assets), you might return a specific offline image/data
        return new Response("Network error or content not found in cache.", { status: 404 })
      })
    }),
  )
})

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})
