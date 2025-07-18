"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import { Spinner } from "@/components/ui/spinner"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AuthClientService.getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
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
        <p className="ml-2">Authenticating...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Or a message like "Redirecting to login..."
  }

  return <>{children}</>
}
