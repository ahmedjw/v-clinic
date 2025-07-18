"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { PWAInstaller } from "@/components/pwa-installer"
import type { Patient, Appointment } from "@/lib/db"

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
    }

    // The IndexedDB initialization and data loading is now handled by AuthGuard
    // This component will primarily render AuthGuard
    setLoading(false) // Set loading to false as AuthGuard handles its own loading
  }, [])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // This component now primarily acts as a wrapper for AuthGuard
  // The actual dashboard logic is within DoctorDashboard and PatientDashboard
  return (
    <AuthGuard>
      {/* The content of the dashboard will be rendered by AuthGuard based on user role */}
      <PWAInstaller />
    </AuthGuard>
  )
}
