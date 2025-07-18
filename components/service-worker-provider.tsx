"use client"

import type React from "react"

import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
          toast({
            title: "Offline Ready",
            description: "App is ready for offline use!",
            duration: 3000,
          })
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
          toast({
            title: "Offline Error",
            description: "Failed to register Service Worker. Offline features may be limited.",
            variant: "destructive",
            duration: 5000,
          })
        })
    }
  }, [toast])

  return <>{children}</>
}
