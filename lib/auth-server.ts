// This file would contain server-side authentication logic.
// For a client-side PWA with mock data, it's not actively used.
// It's kept here to demonstrate the separation of concerns.

import "server-only"
import { cookies } from "next/headers"
import type { User } from "./db"

// In a real application, this would interact with a secure backend
// and database to verify sessions and user roles.
// For this mock PWA, it's a placeholder.

export async function verifySession(): Promise<User | null> {
  // This is a placeholder for server-side session verification.
  // In a real app, you'd decrypt a session token from cookies,
  // validate it, and fetch user data from a database.
  const sessionCookie = cookies().get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    // Simulate session validation (e.g., JWT verification)
    // For mock, we'll just assume a valid session if the cookie exists.
    // In a real app, you'd decode and verify the token.
    const mockUser: User = JSON.parse(sessionCookie) // DANGER: Do NOT do this in production!
    return mockUser
  } catch (error) {
    console.error("Failed to verify session:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  // Simulate fetching user from a database
  // This would typically be part of your Data Access Layer (DAL)
  const mockUsers: User[] = [
    {
      id: "doc1",
      name: "Alice Smith",
      email: "doctor@example.com",
      password: "password",
      role: "doctor",
      specialty: "Cardiology",
      bio: "Experienced cardiologist with a focus on preventive care.",
      phone: "555-111-2222",
      address: "123 Health St",
    },
    {
      id: "pat1",
      name: "Bob Johnson",
      email: "patient@example.com",
      password: "password",
      role: "patient",
      phone: "555-333-4444",
      dob: "1990-01-15",
      gender: "male",
      address: "456 Wellness Ave",
      medicalHistory: "No significant medical history.",
    },
  ]
  return mockUsers.find((user) => user.id === id) || null
}

// Server Actions (examples - not fully implemented for mock PWA)
// These would be used for data mutations from client components
// and would perform authorization checks.
// [^2][^3][^5]
export async function serverLogin(formData: FormData) {
  "use server"
  // Example: In a real app, you'd validate credentials against a DB
  // and set a secure, httpOnly cookie.
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // DANGER: This is a mock. Do NOT use hardcoded credentials in production.
  if (email === "doctor@example.com" && password === "password") {
    const user: User = { id: "doc1", name: "Alice Smith", email, password, role: "doctor" }
    cookies().set("session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    })
    return { success: true, user }
  }
  if (email === "patient@example.com" && password === "password") {
    const user: User = { id: "pat1", name: "Bob Johnson", email, password, role: "patient" }
    cookies().set("session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    })
    return { success: true, user }
  }
  return { success: false, error: "Invalid credentials" }
}

export async function serverLogout() {
  "use server"
  cookies().delete("session")
}

// This file is intentionally left empty or minimal as the application is designed
// to run primarily client-side with IndexedDB for data storage.
// In a full-stack Next.js application, this file would contain server-side
// authentication logic, database interactions, and potentially Server Actions.

// Example of a dummy export to prevent import errors if this file is referenced
// in a server context (e.g., by Next.js internals or other server-side files).
export async function getServerSession() {
  console.warn("getServerSession called in a client-side focused app. This function is a placeholder.")
  return null // Always return null as there's no server session in this setup
}

export async function auth() {
  console.warn("auth() called in a client-side focused app. This function is a placeholder.")
  return { user: null } // Always return null user as there's no server auth in this setup
}
