"use client"

import { useState } from "react"

import { LoginForm } from "@/components/login-form"
import { PWAInstaller } from "@/components/pwa-installer"
import { SyncStatus } from "@/components/sync-status"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
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

  const handleLoginSuccess = () => {
    router.replace("/") // Redirect to home on successful login
  }

  const handleSwitchToRegister = () => {
    router.push("/register")
  }

  // Render a loading state while checking authentication
  // This prevents the login form from flashing before redirect
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
      <LoginForm onLogin={handleLoginSuccess} onSwitchToRegister={handleSwitchToRegister} />
    </div>
  )
}
