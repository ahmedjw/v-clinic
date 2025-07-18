import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import "./globals.css"

export const metadata: Metadata = {
  title: "Virtual Clinic PWA",
  description: "A progressive web application for virtual clinic management.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Virtual Clinic",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
