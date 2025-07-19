"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { DoctorDashboard } from "@/components/doctor-dashboard"
import { PatientDashboard } from "@/components/patient-dashboard"
import { Spinner } from "@/components/ui/spinner"
import type { User, Patient, Doctor } from "@/lib/db"
import { PWAInstaller } from "@/components/pwa-installer"
import { SyncStatus } from "@/components/sync-status"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await AuthClientService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.replace("/login")
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
        <p className="ml-2">Loading user session...</p>
      </div>
    )
  }

  if (!user) {
    // This case should ideally be handled by the router.replace('/login')
    // but as a fallback, we can render nothing or a redirect message.
    return null
  }

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900">
      <PWAInstaller />
      {user.role === "doctor" ? (
        <DoctorDashboard doctor={user as Doctor} />
      ) : (
        <PatientDashboard patient={user as Patient} />
      )}
    </div>
  )
}
