"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { syncService } from "@/lib/sync"

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncService.forcSync()
    } catch (error) {
      console.error("Manual sync failed:", error)
    } finally {
      setSyncing(false)
    }
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
