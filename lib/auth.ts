import { getLocalDB, type User } from "./db";

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<User> {
    if (typeof window === "undefined") {
      throw new Error("Authentication only available in browser");
    }

    // Simulate API call - in real app, this would validate against server
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock user data - in real app, this would come from server
    const mockUsers = [
      {
        email: "doctor@clinic.com",
        password: "doctor123",
        name: "Dr. Smith",
        role: "doctor" as const,
      },
      {
        email: "nurse@clinic.com",
        password: "nurse123",
        name: "Nurse Johnson",
        role: "nurse" as const,
      },
    ];

    const mockUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!mockUser) {
      throw new Error("Invalid credentials");
    }

    const user: User = {
      id: crypto.randomUUID(),
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      createdAt: new Date().toISOString(),
    };

    const localDB = getLocalDB();
    await localDB.setCurrentUser(user);
    this.currentUser = user;

    return user;
  }

  async logout(): Promise<void> {
    if (typeof window === "undefined") return;

    const localDB = getLocalDB();
    await localDB.clearCurrentUser();
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;

    if (this.currentUser) {
      return this.currentUser;
    }

    const localDB = getLocalDB();
    this.currentUser = await localDB.getCurrentUser();
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export const authService = AuthService.getInstance();
