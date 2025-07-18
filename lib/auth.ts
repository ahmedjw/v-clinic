import { getLocalDB } from "./db"
import { AuthClientService } from "./auth-client"
import type { User } from "./db"

// Re-export client-side auth service for client components
export { AuthClientService } from "./auth-client"

// Re-export server-side auth functions for server components/actions
export { verifySession, serverLogin, serverLogout } from "./auth-server"

// Shared types
export type { User, Patient, Doctor, Appointment, MedicalRecord } from "./db"

const authService = new AuthClientService()
const localDB = getLocalDB()

export async function initializeMockData() {
  await AuthClientService.initMockData()
}

export async function getMockUsers(): Promise<User[]> {
  const users = await localDB.getAllUsers()
  return users
}

export async function getMockDoctors(): Promise<User[]> {
  const users = await localDB.getAllUsers()
  return users.filter((user) => user.role === "doctor")
}

export async function getMockPatients(): Promise<User[]> {
  const users = await localDB.getAllUsers()
  return users.filter((user) => user.role === "patient")
}
