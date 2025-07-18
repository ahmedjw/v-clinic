"use client"

import { useState, useEffect } from "react"
import { Cloud, CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { syncData } from "@/lib/sync"

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial sync status check
    const storedLastSync = localStorage.getItem("lastSync")
    if (storedLastSync) {
      setLastSync(new Date(storedLastSync).toLocaleString())
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      // Simulate a network request for sync
      await syncData() // This is a mock sync function
      const now = new Date()
      setLastSync(now.toLocaleString())
      localStorage.setItem("lastSync", now.toISOString())
      toast({
        title: "Sync Successful",
        description: "Your data has been synchronized with the cloud (mock).",
      })
    } catch (error) {
      console.error("Sync failed:", error)
      toast({
        title: "Sync Failed",
        description: "Could not synchronize data. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Cloud className="h-5 w-5 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>Online</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <CloudOff className="h-5 w-5 text-red-500" />
            </TooltipTrigger>
            <TooltipContent>Offline</TooltipContent>
          </Tooltip>
        )}
        {lastSync && <span className="text-sm text-gray-600 hidden sm:inline">Last Sync: {lastSync}</span>}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleManualSync} disabled={isSyncing || !isOnline}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="sr-only">Sync Now</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isSyncing ? "Syncing..." : isOnline ? "Sync Now" : "Offline - Cannot Sync"}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
