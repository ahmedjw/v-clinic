"use client"

import { RegisterForm } from "@/components/register-form"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import type { User } from "@/lib/db"

export default function RegisterPage() {
  const router = useRouter()
  const authService = new AuthClientService()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await authService.isAuthenticated()
      if (isAuthenticated) {
        router.replace("/") // Redirect to home if already logged in
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleRegister = (user: User) => {
    // On successful registration, redirect to the home page
    router.push("/")
  }

  const handleSwitchToLogin = () => {
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <RegisterForm onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
}
