"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { getSyncService } from "@/lib/sync"

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  const handleSync = async () => {
    if (typeof window === "undefined") return

    setSyncing(true)
    try {
      const syncService = getSyncService()
      await syncService.forcSync()
    } catch (error) {
      console.error("Manual sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center space-x-1">
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </Badge>
      {isOnline && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center space-x-1 bg-transparent"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </Button>
      )}
    </div>
  )
}
