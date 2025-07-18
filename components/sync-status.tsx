"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, CloudOff, Cloud } from "lucide-react"
import { AuthClientService } from "@/lib/auth-client"

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await AuthClientService.syncData()

    } catch (error) {
      console.error("Manual sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      {!isOnline && (
        <div className="flex items-center text-red-500">
          <CloudOff className="h-4 w-4 mr-1" /> Offline
        </div>
      )}
      {isOnline && (
        <div className="flex items-center text-green-500">
          <Cloud className="h-4 w-4 mr-1" /> Online
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualSync}
        disabled={isSyncing || !isOnline}
        className="flex items-center bg-transparent"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync Data"}
      </Button>
    </div>
  )
}
