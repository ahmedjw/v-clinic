import type { User, Patient, Doctor } from "./db";
import { getLocalDB } from "./db";
import { v4 as uuidv4 } from "uuid";

// Singleton pattern for AuthClientService
let authClientServiceInstance: AuthClientService | null = null;

export class AuthClientService {
  private mockUsers: User[] = [];
  private currentUser: User | null = null;

  constructor() {
    if (authClientServiceInstance) {
      return authClientServiceInstance;
    }
    this.loadMockUsersFromDB();
    authClientServiceInstance = this;
  }

  private async loadMockUsersFromDB() {
    const localDB = getLocalDB();
    const patients = await localDB.getAllPatients();
    const doctors = await localDB.getAllDoctors();
    this.mockUsers = [...patients, ...doctors];
    // Attempt to restore current user from session storage
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  public async login(email: string, password: string): Promise<User> {
    await this.loadMockUsersFromDB(); // Ensure mock users are up-to-date
    const user = this.mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    this.currentUser = user;
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  }

  public async register(
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "synced"> & {
      password: string;
    }
  ): Promise<User> {
    await this.loadMockUsersFromDB(); // Ensure mock users are up-to-date
    const localDB = getLocalDB();

    // Check if user already exists
    if (this.mockUsers.some((u) => u.email === userData.email)) {
      throw new Error("User with this email already exists.");
    }

    const newUser: User | Patient | Doctor = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      ...userData,
      // Ensure all properties are defined for Patient/Doctor types
      dateOfBirth: (userData as Patient).dateOfBirth || "",
      gender: (userData as Patient).gender || "other",
      address: (userData as Patient).address || "",
      emergencyContact: (userData as Patient).emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
      medicalHistory: (userData as Patient).medicalHistory || "",
      allergies: (userData as Patient).allergies || [],
      currentMedications: (userData as Patient).currentMedications || [],
      bloodType: (userData as Patient).bloodType || "",
      height: (userData as Patient).height || 0,
      weight: (userData as Patient).weight || 0,
      assignedDoctorIds: (userData as Patient).assignedDoctorIds || [],
      specialization: (userData as Doctor).specialization || "",
      licenseNumber: (userData as Doctor).licenseNumber || "",
      education: (userData as Doctor).education || [],
      experience: (userData as Doctor).experience || [],
    };

    if (newUser.role === "patient") {
      await localDB.addPatient(newUser as Patient);
    } else if (newUser.role === "doctor") {
      await localDB.addDoctor(newUser as Doctor);
    } else {
      throw new Error("Invalid user role specified.");
    }

    this.mockUsers.push(newUser);
    this.currentUser = newUser;
    sessionStorage.setItem("currentUser", JSON.stringify(newUser));
    return newUser;
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    sessionStorage.removeItem("currentUser");
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.currentUser) {
      const storedUser = sessionStorage.getItem("currentUser");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    }
    return this.currentUser;
  }

  public async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  }

  // Mock data retrieval methods
  public getMockUsers(): User[] {
    return this.mockUsers;
  }

  public getMockDoctors(): Doctor[] {
    return this.mockUsers.filter((user) => user.role === "doctor") as Doctor[];
  }

  public getMockPatients(): Patient[] {
    return this.mockUsers.filter(
      (user) => user.role === "patient"
    ) as Patient[];
  }

  public updateMockUser(updatedUser: User): void {
    const index = this.mockUsers.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      this.mockUsers[index] = updatedUser;
      if (this.currentUser?.id === updatedUser.id) {
        this.currentUser = updatedUser;
        sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  }
}
