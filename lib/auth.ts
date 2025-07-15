import { localDB, type User } from "./db"

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<User> {
    // Simulate API call - in real app, this would validate against server
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock user data - in real app, this would come from server
    const mockUsers = [
      { email: "doctor@clinic.com", password: "doctor123", name: "Dr. Smith", role: "doctor" as const },
      { email: "nurse@clinic.com", password: "nurse123", name: "Nurse Johnson", role: "nurse" as const },
    ]

    const mockUser = mockUsers.find((u) => u.email === email && u.password === password)

    if (!mockUser) {
      throw new Error("Invalid credentials")
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      createdAt: new Date().toISOString(),
    }

    await localDB.setCurrentUser(user)
    this.currentUser = user

    return user
  }

  async logout(): Promise<void> {
    await localDB.clearCurrentUser()
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser
    }

    this.currentUser = await localDB.getCurrentUser()
    return this.currentUser
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }
}

export const authService = AuthService.getInstance()
