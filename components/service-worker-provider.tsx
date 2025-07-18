"use client"

import type React from "react"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface ServiceWorkerProviderProps {
  children: React.ReactNode
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const { toast } = useToast()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)

          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New content available
                    toast({
                      title: "Update Available",
                      description: "New content is available! Click to update.",
                      action: (
                        <Button
                          onClick={() => {
                            window.location.reload()
                          }}
                          className="whitespace-nowrap"
                        >
                          Refresh
                        </Button>
                      ),
                      duration: 10000,
                    })
                  } else {
                    // Content is cached for offline use
                    console.log("Content is now available offline!")
                  }
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }
  }, [toast])

  return <>{children}</>
}
