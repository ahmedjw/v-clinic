"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getAuthClientService } from "@/lib/auth-client"
import { getLocalDB, type User, type Patient } from "@/lib/db"
import { DoctorDashboard } from "./doctor-dashboard"
import { PatientDashboard } from "./patient-dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, LogOut, UserIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { PatientProfileModal } from "./patient-profile-modal"
import { DoctorProfileModal } from "./doctor-profile-modal"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<(User | Patient)[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<User | Patient | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const authService = getAuthClientService()
  const localDB = getLocalDB()

  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      await localDB.init() // Ensure IndexedDB is initialized
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
      if (!user && pathname !== "/login" && pathname !== "/register") {
        router.push("/login")
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/") // Redirect to dashboard if already logged in
      }
    } catch (error) {
      console.error("Authentication check failed:", error)
      setCurrentUser(null)
      if (pathname !== "/login" && pathname !== "/register") {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router, authService, localDB])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length > 2) {
      try {
        await localDB.init()
        const allPatients = await localDB.getPatients()
        const allDoctors = authService.getMockUsers().filter((u: User) => u.role === "doctor") // Get all mock doctors

        const filteredPatients = allPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase()),
        )
        const filteredDoctors = allDoctors.filter(
          (d: User) =>
            d.name.toLowerCase().includes(query.toLowerCase()) || d.email.toLowerCase().includes(query.toLowerCase()),
        )
        setSearchResults([...filteredDoctors, ...filteredPatients])
        setShowSearchResults(true)
      } catch (error) {
        console.error("Search failed:", error)
        setSearchResults([])
      }
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const handleViewProfile = (profile: User | Patient) => {
    setSelectedProfile(profile)
    setShowSearchResults(false) // Hide search results after selecting
    setSearchQuery("") // Clear search query
  }

  const handleCloseProfileModal = () => {
    setSelectedProfile(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (
    !currentUser &&
    (pathname === "/login" || pathname === "/register" || pathname.startsWith("/share-appointment"))
  ) {
    return <>{children}</>
  }

  if (!currentUser) {
    return null // Should redirect to login, but prevent rendering dashboard if not logged in
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <a href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <UserIcon className="h-6 w-6" />
            <span className="sr-only">Virtual Clinic</span>
          </a>
          <span className="text-muted-foreground transition-colors hover:text-foreground">Virtual Clinic PWA</span>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-transparent">
              <UserIcon className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <a href="#" className="flex items-center gap-2 text-lg font-semibold">
                <UserIcon className="h-6 w-6" />
                <span className="sr-only">Virtual Clinic</span>
              </a>
              <span className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                Virtual Clinic PWA
              </span>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients or doctors..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery.length > 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} // Delay to allow click
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-50 w-full rounded-md border bg-popover p-2 shadow-lg mt-1">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onMouseDown={() => handleViewProfile(result)} // Use onMouseDown to trigger before onBlur
                  >
                    <span>{result.name}</span>
                    <Badge variant="secondary">
                      {"role" in result
                        ? result.role === "doctor"
                          ? "Doctor"
                          : "User"
                        : "Patient"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {currentUser.name} ({currentUser.role})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {currentUser.role === "doctor" && <DoctorDashboard user={currentUser} />}
        {currentUser.role === "patient" && <PatientDashboard user={currentUser} />}
      </main>

      {selectedProfile && "specialization" in selectedProfile ? (
        <DoctorProfileModal doctor={selectedProfile} onClose={handleCloseProfileModal} />
      ) : (
        selectedProfile && (
          <PatientProfileModal patient={selectedProfile as Patient} onClose={handleCloseProfileModal} />
        )
      )}
    </div>
  )
}
