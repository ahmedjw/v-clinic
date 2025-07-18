"use client"

import type React from "react"

import { ServiceWorkerProvider } from "@/components/service-worker-provider"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
    </>
  )
}
