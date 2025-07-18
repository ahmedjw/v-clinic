"use client";

import { getLocalDB } from "./db"; // Import getLocalDB for user persistence
import type { Patient } from "./db"; // Import other types for mock data creation

// Define the User interface with all expected properties
export interface User {
  id: string;
  email: string;
  name: string;
  role: "doctor" | "patient";
  phone?: string; // Added phone number for users
  specialization?: string;
  licenseNumber?: string;
  patientId?: string; // for patients - links to Patient record
  createdAt: string;
  updatedAt?: string; // Added updatedAt for user profiles
}

// Mock user data - in-memory for client-side authentication
// This array will be reset on page refresh, but the logged-in user
// will be persisted in IndexedDB.
const mockUsers: User[] = [
  {
    id: "doctor-1",
    email: "doctor@clinic.com",
    name: "Dr. Sarah Smith",
    role: "doctor",
    phone: "+1-555-0100", // Mock phone number for doctor
    specialization: "General Medicine",
    licenseNumber: "MD12345",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "patient-1",
    email: "patient@clinic.com",
    name: "John Doe",
    role: "patient",
    phone: "+1-555-0101", // Mock phone number for patient
    patientId: "mock-patient-1", // This ID will be used to link to IndexedDB patient record
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "patient-2",
    email: "patient2@clinic.com",
    name: "Jane Smith",
    role: "patient",
    phone: "+1-555-0102", // Mock phone number for patient 2
    patientId: "mock-patient-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class AuthClientService {
  private static currentUser: User | null = null;

  // Helper to get all mock users (doctors and patients)
  getMockUsers(): User[] {
    return mockUsers;
  }

  // Helper to get all mock doctors
  getMockDoctors(): User[] {
    return mockUsers.filter((user) => user.role === "doctor");
  }

  async register(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    role: "doctor" | "patient";
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
  }): Promise<User> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user already exists
    if (mockUsers.some((u) => u.email === userData.email)) {
      throw new Error("User with this email already exists");
    }

    // Basic validation
    if (userData.password !== userData.confirmPassword) {
      throw new Error("Passwords do not match");
    }
    if (userData.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const newUser: User = {
      id: `${userData.role}-${crypto.randomUUID()}`,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      specialization:
        userData.role === "doctor" ? userData.specialization : undefined,
      licenseNumber:
        userData.role === "doctor" ? userData.licenseNumber : undefined,
      patientId:
        userData.role === "patient"
          ? `patient-record-${crypto.randomUUID()}`
          : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add new user to mock data (in-memory, will reset on refresh)
    mockUsers.push(newUser);

    // Persist user in IndexedDB for session management
    const localDB = getLocalDB();
    await localDB.setCurrentUser(newUser);
    AuthClientService.currentUser = newUser;

    // If patient, create a mock patient record in IndexedDB
    if (newUser.role === "patient" && newUser.patientId) {
      const defaultDoctor = mockUsers.find((u) => u.role === "doctor"); // Assign to a default doctor
      const assignedDoctorIds = defaultDoctor ? [defaultDoctor.id] : [];

      await localDB.addPatient({
        id: newUser.patientId, // Use the generated patientId
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || "",
        dateOfBirth: "2000-01-01", // Default, can be updated via patient form
        gender: "other", // Default, can be updated
        address: "N/A",
        emergencyContact: {
          name: "N/A",
          phone: "N/A",
          relationship: "N/A",
        },
        medicalHistory: "",
        allergies: [],
        currentMedications: [],
        bloodType: undefined,
        height: undefined,
        weight: undefined,
        assignedDoctorIds: assignedDoctorIds, // Assign to default doctor
      });
    }

    return newUser;
  }

  async login(email: string, password: string): Promise<User> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Find user by email and password (mocked)
    const user = mockUsers.find((u) => u.email === email);

    // In a real app, you'd verify a hashed password here.
    // For this client-only mock, we'll just check if the user exists and the password matches the mock.
    if (
      !user ||
      (user.email === "doctor@clinic.com" && password !== "doctor123") ||
      (user.email === "patient@clinic.com" && password !== "patient123") ||
      (user.email === "patient2@clinic.com" && password !== "patient123")
    ) {
      throw new Error("Invalid credentials");
    }

    // Persist user in IndexedDB for session management
    const localDB = getLocalDB();
    await localDB.setCurrentUser(user);
    AuthClientService.currentUser = user;

    // Create mock patient record if it doesn't exist for patient user
    if (user.role === "patient" && user.patientId) {
      const existingPatient = (await localDB.getPatients()).find(
        (p) => p.id === user.patientId
      );
      if (!existingPatient) {
        const defaultDoctor = mockUsers.find((u) => u.role === "doctor");
        const assignedDoctorIds = defaultDoctor ? [defaultDoctor.id] : [];

        const newPatient: Patient = {
          id: user.patientId,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          dateOfBirth:
            user.email === "patient@clinic.com" ? "1990-05-15" : "1985-08-22",
          gender: user.email === "patient@clinic.com" ? "male" : "female",
          address:
            user.email === "patient@clinic.com"
              ? "123 Main St, City, State 12345"
              : "456 Oak Ave, City, State 12345",
          emergencyContact: {
            name:
              user.email === "patient@clinic.com" ? "Mary Doe" : "Bob Smith",
            phone:
              user.email === "patient@clinic.com"
                ? "+1-555-0199"
                : "+1-555-0188",
            relationship:
              user.email === "patient@clinic.com" ? "Spouse" : "Brother",
          },
          medicalHistory:
            user.email === "patient@clinic.com"
              ? "No significant medical history"
              : "Hypertension, managed with medication",
          allergies:
            user.email === "patient@clinic.com"
              ? ["Penicillin"]
              : ["Shellfish", "Pollen"],
          currentMedications:
            user.email === "patient@clinic.com" ? [] : ["Lisinopril 10mg"],
          bloodType: user.email === "patient@clinic.com" ? "O+" : "A-",
          height: user.email === "patient@clinic.com" ? 175 : 165,
          weight: user.email === "patient@clinic.com" ? 70 : 60,
          assignedDoctorIds: assignedDoctorIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: true,
        };
        await localDB.addPatient(newPatient);

        // Add some mock appointments and medical records for this patient
        const doctorId = defaultDoctor?.id || "doctor-1"; // Use default doctor ID
        const patientId = newPatient.id;

        // Add mock appointments
        await localDB.addAppointment({
          patientId: patientId,
          patientName: newPatient.name,
          doctorId: doctorId,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Next week
          time: "10:00",
          type: "consultation",
          status: "scheduled",
          notes: "Regular checkup",
        });

        // Add mock medical record
        await localDB.addMedicalRecord({
          patientId: patientId,
          doctorId: doctorId,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Last month
          diagnosis:
            newPatient.email === "patient@clinic.com"
              ? "Annual Physical Exam"
              : "Hypertension Follow-up",
          symptoms:
            newPatient.email === "patient@clinic.com"
              ? ["None"]
              : ["Mild headaches"],
          treatment:
            newPatient.email === "patient@clinic.com"
              ? "Continue healthy lifestyle"
              : "Continue current medication",
          prescription:
            newPatient.email === "patient@clinic.com"
              ? []
              : [
                  {
                    medication: "Lisinopril",
                    dosage: "10mg",
                    frequency: "Once daily",
                    duration: "Ongoing",
                  },
                ],
          vitals: {
            bloodPressure:
              newPatient.email === "patient@clinic.com" ? "120/80" : "135/85",
            heartRate: newPatient.email === "patient@clinic.com" ? 72 : 78,
            temperature: 36.5,
            weight: newPatient.email === "patient@clinic.com" ? 70 : 60,
            height: newPatient.email === "patient@clinic.com" ? 175 : 165,
          },
          notes:
            newPatient.email === "patient@clinic.com"
              ? "Patient in good health"
              : "Blood pressure well controlled",
        });
      }
    }

    return user;
  }

  async logout(): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const localDB = getLocalDB();
    await localDB.clearCurrentUser();
    AuthClientService.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (AuthClientService.currentUser) {
      return AuthClientService.currentUser;
    }

    // Try to retrieve from IndexedDB
    const localDB = getLocalDB();
    const user = await localDB.getCurrentUser();
    AuthClientService.currentUser = user;
    return user;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Method to update user details (mocked)
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }

    const updatedUser = {
      ...mockUsers[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    mockUsers[userIndex] = updatedUser;

    // If the updated user is the current logged-in user, update the session
    if (AuthClientService.currentUser?.id === userId) {
      AuthClientService.currentUser = updatedUser;
      const localDB = getLocalDB();
      await localDB.setCurrentUser(updatedUser);
    }

    // If it's a patient, also update their record in IndexedDB
    if (updatedUser.role === "patient" && updatedUser.patientId) {
      const localDB = getLocalDB();
      const patients = await localDB.getPatients();
      const patient = patients.find((p) => p.id === updatedUser.patientId);
      if (patient) {
        await localDB.updatePatient({
          ...patient,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || patient.phone,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return updatedUser;
  }
}

// Singleton instance
let authClientInstance: AuthClientService | null = null;

export function getAuthClientService(): AuthClientService {
  if (!authClientInstance) {
    authClientInstance = new AuthClientService();
  }
  return authClientInstance;
}
