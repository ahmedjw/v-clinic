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
  "/icon-256x256.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
  "/favicon.ico",
  "/install-prompt.html",
  "/index.html", // For static export, index.html might be the root
  "/icon.png",
  // Add other static assets your app needs offline
]

self.addEventListener("install", (event) => {
  console.log("Service Worker: Install event.")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell.")
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

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and can only be consumed once. We must clone it so that
          // the browser can consume one and we can consume the other.
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch((error) => {
          console.error("Service Worker: Fetch failed:", error)
          // Serve a fallback page for navigation requests if offline
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html" || "/") // You might want a dedicated offline page
          }
          // For other requests, return a generic error response or null
          return new Response("Network error occurred", { status: 408, headers: { "Content-Type": "text/plain" } })
        })
    }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activate event.")
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Service Worker: Deleting old cache", cacheName)
            return caches.delete(cacheName)
          }
          return null
        }),
      )
    }),
  )
  self.clients.claim() // Take control of clients immediately
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Optional: Background Sync (requires 'background-sync' permission)
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'background-sync-clinic-data') {
//     console.log('Performing background sync for clinic data...');
//     event.waitUntil(
//       // Call your data synchronization logic here
//       // e.g., import { syncOfflineData } from './lib/sync'; syncOfflineData();
//       new Promise(resolve => setTimeout(() => {
//         console.log('Background sync complete!');
//         resolve();
//       }, 2000))
//     );
//   }
// });
