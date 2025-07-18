"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
      toast({
        title: "Install App",
        description: "Add Virtual Clinic to your home screen for quick access!",
        action: (
          <Button
            onClick={() => {
              setShowInstallPrompt(true)
            }}
            className="whitespace-nowrap"
          >
            Install
          </Button>
        ),
        duration: 10000,
      })
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true)
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
      toast({
        title: "Installation Successful!",
        description: "Virtual Clinic has been added to your home screen.",
      })
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Check if the app is already installed (e.g., running in standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [toast])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        console.log("User accepted the install prompt.")
      } else {
        console.log("User dismissed the install prompt.")
      }
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  if (!deferredPrompt || isAppInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install Virtual Clinic</DialogTitle>
          <DialogDescription>
            Add this application to your home screen for a faster and more integrated experience.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowInstallPrompt(false)}>
            Not now
          </Button>
          <Button onClick={handleInstallClick}>Install App</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
