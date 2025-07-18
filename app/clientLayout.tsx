"use client"

import type React from "react"

import { Inter } from "next/font/google"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"
import { PWAInstaller } from "@/components/pwa-installer"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { initializeMockData } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize mock data when the app loads
    initializeMockData()
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <ServiceWorkerProvider>
          {children}
          <PWAInstaller />
          <Toaster />
        </ServiceWorkerProvider>
      </body>
    </html>
  )
}
