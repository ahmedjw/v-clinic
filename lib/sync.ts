import { getLocalDB } from "./db"

export class SyncService {
  private static instance: SyncService
  private isOnline = false
  private syncInProgress = false

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine

      // Listen for online/offline events
      window.addEventListener("online", () => {
        this.isOnline = true
        this.syncData()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
      })

      // Periodic sync when online
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncData()
        }
      }, 30000) // Sync every 30 seconds
    }
  }

  async syncData(): Promise<void> {
    if (typeof window === "undefined" || !this.isOnline || this.syncInProgress) {
      return
    }

    this.syncInProgress = true

    try {
      const localDB = getLocalDB()
      const syncQueue = await localDB.getSyncQueue()

      for (const item of syncQueue) {
        await this.processSyncItem(item)
      }

      // Clear sync queue after successful sync
      await localDB.clearSyncQueue()

      console.log("Sync completed successfully")
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    // Simulate API calls - in real app, these would be actual server requests
    await new Promise((resolve) => setTimeout(resolve, 100))

    switch (item.type) {
      case "CREATE_PATIENT":
        console.log("Syncing patient creation:", item.data.name)
        break
      case "CREATE_APPOINTMENT":
        console.log("Syncing appointment creation:", item.data.patientName)
        break
      case "UPDATE_APPOINTMENT":
        console.log("Syncing appointment update:", item.data.id)
        break
      default:
        console.log("Unknown sync item type:", item.type)
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline
  }

  async forcSync(): Promise<void> {
    await this.syncData()
  }
}

// Create a function to get sync service safely
export const getSyncService = (): SyncService => {
  return SyncService.getInstance()
}

// For backward compatibility
export const syncService = {
  forcSync: () => {
    if (typeof window === "undefined") return Promise.resolve()
    return getSyncService().forcSync()
  },
  getConnectionStatus: () => {
    if (typeof window === "undefined") return false
    return getSyncService().getConnectionStatus()
  },
}
