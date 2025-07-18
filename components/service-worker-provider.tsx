"use client"

import { useEffect } from "react"

export function ServiceWorkerProvider() {
  useEffect(() => {
    // Only register service worker in browser environment
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm("New version available! Refresh to update?")) {
                window.location.reload()
              }
            }
          })
        }
      })

      console.log("Service Worker registered successfully:", registration)
    } catch (error) {
      console.error("Service Worker registration failed:", error)
    }
  }

  return null
}
