"use client"

import { RegisterForm } from "@/components/register-form"
import { PWAInstaller } from "@/components/pwa-installer"
import { SyncStatus } from "@/components/sync-status"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isAuthenticated = await AuthClientService.isAuthenticated()
      if (isAuthenticated) {
        router.replace("/") // Redirect to home if already authenticated
      }
    }
    checkAuthAndRedirect()
  }, [router])

  const handleRegisterSuccess = () => {
    router.replace("/") // Redirect to home on successful registration
  }

  const handleSwitchToLogin = () => {
    router.push("/login")
  }

  // Render a loading state while checking authentication
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    AuthClientService.isAuthenticated().then((isAuthenticated) => {
      if (!isAuthenticated) {
        setLoading(false)
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
        <p className="ml-2">Checking session...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <PWAInstaller />
      <SyncStatus />
      <RegisterForm onRegister={handleRegisterSuccess} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  )
}
