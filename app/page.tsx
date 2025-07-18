/*eslint-disable*/

"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { DoctorDashboard } from "@/components/doctor-dashboard"
import { PatientDashboard } from "@/components/patient-dashboard"
import { AuthGuard } from "@/components/auth-guard"
import type { User } from "@/lib/db"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const authService = new AuthClientService()

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser()
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    // Should be redirected by AuthGuard or useEffect, but as a fallback
    return null
  }

  return (
    <AuthGuard>
      {user.role === "doctor" ? <DoctorDashboard doctor={user} /> : <PatientDashboard patient={user} />}
    </AuthGuard>
  )
}
