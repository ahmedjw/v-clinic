"use client"

import type React from "react"

import { useEffect } from "react"

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)

        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)

        })
    }
  }, [])

  return <>{children}</>
}
