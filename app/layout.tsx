import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Virtual Clinic",
  description: "A local-first virtual clinic management system",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Virtual Clinic",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Virtual Clinic" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerProvider />
        {children}
      </body>
    </html>
  )
}
