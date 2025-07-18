const CACHE_NAME = "virtual-clinic-v1.2"
const STATIC_CACHE_NAME = "virtual-clinic-static-v1.2"
const DYNAMIC_CACHE_NAME = "virtual-clinic-dynamic-v1.2"

// Files to cache immediately
const STATIC_FILES = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/favicon.ico"]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Caching static files...")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("Static files cached successfully")
        return self.skipWaiting() // Activate immediately
      })
      .catch((error) => {
        console.error("Failed to cache static files:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker activated")
        return self.clients.claim() // Take control immediately
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches
      .match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log("Serving from cache:", request.url)
          return cachedResponse
        }

        // Otherwise fetch from network
        console.log("Fetching from network:", request.url)
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
              return networkResponse
            }

            // Clone the response
            const responseToCache = networkResponse.clone()

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })

            return networkResponse
          })
          .catch((error) => {
            console.error("Network fetch failed:", error)

            // Return offline page for navigation requests
            if (request.mode === "navigate") {
              return (
                caches.match("/") ||
                new Response("Offline - Please check your connection", {
                  status: 503,
                  statusText: "Service Unavailable",
                })
              )
            }

            // Return a generic offline response for other requests
            return new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            })
          })
      })
      .catch((error) => {
        console.error("Cache match failed:", error)
        return fetch(request)
      }),
  )
})

// Handle background sync (for future use)
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag)
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Add your background sync logic here
      Promise.resolve(),
    )
  }
})

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event)
  // Add push notification logic here
})
