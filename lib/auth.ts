/* eslint-disable */

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

    // Mock user data - expanded to include patients
    const mockUsers = [
      {
        email: "doctor@clinic.com",
        password: "doctor123",
        name: "Dr. Sarah Smith",
        role: "doctor" as const,
        specialization: "General Medicine",
        licenseNumber: "MD12345",
      },
      {
        email: "patient@clinic.com",
        password: "patient123",
        name: "John Doe",
        role: "patient" as const,
        patientId: "patient-1",
      },
      {
        email: "patient2@clinic.com",
        password: "patient123",
        name: "Jane Smith",
        role: "patient" as const,
        patientId: "patient-2",
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
      specialization: mockUser.specialization,
      licenseNumber: mockUser.licenseNumber,
      patientId: mockUser.patientId,
      createdAt: new Date().toISOString(),
    };

    const localDB = getLocalDB();
    await localDB.setCurrentUser(user);
    this.currentUser = user;

    // Create mock patient records if they don't exist
    if (user.role === "patient") {
      await this.createMockPatientRecord(user);
    }

    return user;
  }

  private async createMockPatientRecord(user: User): Promise<void> {
    try {
      const localDB = getLocalDB();
      const patients = await localDB.getPatients();

      // Check if patient record already exists
      const existingPatient = patients.find((p) => p.email === user.email);
      if (existingPatient) return;

      // Create mock patient record
      const mockPatientData = {
        id: user.patientId ?? crypto.randomUUID(),
        name: user.name,
        email: user.email,
        phone:
          user.email === "patient@clinic.com" ? "+1-555-0123" : "+1-555-0124",
        dateOfBirth:
          user.email === "patient@clinic.com" ? "1990-05-15" : "1985-08-22",
        gender:
          user.email === "patient@clinic.com"
            ? ("male" as const)
            : ("female" as const),
        address:
          user.email === "patient@clinic.com"
            ? "123 Main St, City, State 12345"
            : "456 Oak Ave, City, State 12345",
        emergencyContact: {
          name: user.email === "patient@clinic.com" ? "Mary Doe" : "Bob Smith",
          phone:
            user.email === "patient@clinic.com" ? "+1-555-0199" : "+1-555-0188",
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
        assignedDoctorIds: [], // or provide default doctor IDs if needed
      };

      await localDB.addPatient(mockPatientData);

      // Add some mock appointments and medical records
      const patient = await localDB
        .getPatients()
        .then((patients) => patients.find((p) => p.email === user.email));

      if (patient) {
        // Add mock appointments
        await localDB.addAppointment({
          patientId: patient.id,
          patientName: patient.name,
          doctorId: "doctor-1",
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
          patientId: patient.id,
          doctorId: "doctor-1",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Last month
          diagnosis:
            user.email === "patient@clinic.com"
              ? "Annual Physical Exam"
              : "Hypertension Follow-up",
          symptoms:
            user.email === "patient@clinic.com" ? ["None"] : ["Mild headaches"],
          treatment:
            user.email === "patient@clinic.com"
              ? "Continue healthy lifestyle"
              : "Continue current medication",
          prescription:
            user.email === "patient@clinic.com"
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
              user.email === "patient@clinic.com" ? "120/80" : "135/85",
            heartRate: user.email === "patient@clinic.com" ? 72 : 78,
            temperature: 36.5,
            weight: user.email === "patient@clinic.com" ? 70 : 60,
            height: user.email === "patient@clinic.com" ? 175 : 165,
          },
          notes:
            user.email === "patient@clinic.com"
              ? "Patient in good health"
              : "Blood pressure well controlled",
        });
      }
    } catch (error) {
      console.error("Failed to create mock patient record:", error);
    }
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
