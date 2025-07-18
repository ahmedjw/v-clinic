"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const authService = new AuthClientService()

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
        // If on login/register page and authenticated, redirect to home
        if (pathname === "/login" || pathname === "/register") {
          router.replace("/")
        }
      } else {
        setIsAuthenticated(false)
        // If not authenticated and not on login/register/share page, redirect to login
        if (pathname !== "/login" && pathname !== "/register" && !pathname.startsWith("/share-appointment")) {
          router.replace("/login")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated and on a protected route, return null (redirection handled by useEffect)
  if (
    !isAuthenticated &&
    pathname !== "/login" &&
    pathname !== "/register" &&
    !pathname.startsWith("/share-appointment")
  ) {
    return null
  }

  // If authenticated, or on a public route (login/register/share), render children
  return <>{children}</>
}
