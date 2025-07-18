import type { User, Patient, Doctor, Appointment, MedicalRecord } from "./db";
import { v4 as uuidv4 } from "uuid";

export class AuthClientService {
  private static DB_NAME = "virtualClinicDB";
  private static DB_VERSION = 1;
  private static STORE_USERS = "users";
  private static STORE_APPOINTMENTS = "appointments";
  private static STORE_MEDICAL_RECORDS = "medicalRecords";
  private static CURRENT_USER_KEY = "currentUser";

  private static db: IDBDatabase | null = null;
  private static mockUsers: User[] = [];
  private static currentUser: User | null = null;

  private static async openDb(): Promise<IDBDatabase> {
    if (AuthClientService.db) {
      return AuthClientService.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        AuthClientService.DB_NAME,
        AuthClientService.DB_VERSION
      );

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(AuthClientService.STORE_USERS)) {
          db.createObjectStore(AuthClientService.STORE_USERS, {
            keyPath: "id",
          });
        }
        if (
          !db.objectStoreNames.contains(AuthClientService.STORE_APPOINTMENTS)
        ) {
          const appointmentStore = db.createObjectStore(
            AuthClientService.STORE_APPOINTMENTS,
            { keyPath: "id" }
          );
          appointmentStore.createIndex("patientId", "patientId", {
            unique: false,
          });
          appointmentStore.createIndex("doctorId", "doctorId", {
            unique: false,
          });
        }
        if (
          !db.objectStoreNames.contains(AuthClientService.STORE_MEDICAL_RECORDS)
        ) {
          const medicalRecordStore = db.createObjectStore(
            AuthClientService.STORE_MEDICAL_RECORDS,
            { keyPath: "id" }
          );
          medicalRecordStore.createIndex("patientId", "patientId", {
            unique: false,
          });
          medicalRecordStore.createIndex("doctorId", "doctorId", {
            unique: false,
          });
        }
      };

      request.onsuccess = (event) => {
        AuthClientService.db = (event.target as IDBOpenDBRequest).result;
        resolve(AuthClientService.db);
      };

      request.onerror = (event) => {
        console.error(
          "IndexedDB error:",
          (event.target as IDBOpenDBRequest).error
        );
        reject("Failed to open IndexedDB");
      };
    });
  }

  private static async getObjectStore(
    storeName: string,
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore> {
    const db = await AuthClientService.openDb();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private static async getAll<T>(storeName: string): Promise<T[]> {
    const store = await AuthClientService.getObjectStore(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private static async putObject<T>(storeName: string, obj: T): Promise<T> {
    const store = await AuthClientService.getObjectStore(
      storeName,
      "readwrite"
    );
    return new Promise((resolve, reject) => {
      const request = store.put(obj);
      request.onsuccess = () => resolve(obj);
      request.onerror = () => reject(request.error);
    });
  }

  private static async getObject<T>(
    storeName: string,
    id: string
  ): Promise<T | undefined> {
    const store = await AuthClientService.getObjectStore(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Mock Data ---
  private static initialMockUsers: (User | Patient | Doctor)[] = [
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
    },
    {
      id: "doc2",
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: "password",
      role: "doctor",
      specialty: "Pediatrics",
      bio: "Dedicated pediatrician committed to child health.",
      phone: "555-999-8888",
      address: "789 Kids Rd",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
    },
    {
      id: "pat2",
      name: "Diana Prince",
      email: "diana@example.com",
      password: "password",
      role: "patient",
      phone: "555-777-6666",
      dob: "1985-05-20",
      gender: "female",
      address: "101 Hero Blvd",
      medicalHistory: "Allergies: Penicillin.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
    },
  ];

  private static initialMockAppointments: Appointment[] = [
    {
      id: "app1",
      patientId: "pat1",
      doctorId: "doc1",
      doctorName: "Alice Smith",
      patientName: "Bob Johnson",
      patientEmail: "patient@example.com",
      date: "2024-07-25",
      time: "10:00",
      reason: "Routine checkup",
      status: "confirmed",
      createdAt: "2024-07-20T10:00:00Z",
      updatedAt: "2024-07-20T10:00:00Z",
      synced: true,
    },
    {
      id: "app2",
      patientId: "pat1",
      doctorId: "doc2",
      doctorName: "Charlie Brown",
      patientName: "Bob Johnson",
      patientEmail: "patient@example.com",
      date: "2024-08-01",
      time: "14:30",
      reason: "Child vaccination",
      status: "pending",
      createdAt: "2024-07-22T11:00:00Z",
      updatedAt: "2024-07-22T11:00:00Z",
      synced: true,
    },
    {
      id: "app3",
      patientId: "pat2",
      doctorId: "doc1",
      doctorName: "Alice Smith",
      patientName: "Diana Prince",
      patientEmail: "diana@example.com",
      date: "2024-07-28",
      time: "11:00",
      reason: "Follow-up on blood pressure",
      status: "pending",
      createdAt: "2024-07-23T09:00:00Z",
      updatedAt: "2024-07-23T09:00:00Z",
      synced: true,
    },
  ];

  private static initialMockMedicalRecords: MedicalRecord[] = [
    {
      id: "rec1",
      patientId: "pat1",
      doctorId: "doc1",
      patientName: "Bob Johnson",
      diagnosis: "Common Cold",
      treatment: "Rest and fluids",
      notes: "Patient presented with mild cold symptoms.",
      createdAt: "2024-07-25T10:30:00Z",
      updatedAt: "2024-07-25T10:30:00Z",
      synced: true,
      date: "2024-07-25",
    },
  ];

  // --- Initialization and Sync ---
  static async initMockData() {
    const db = await AuthClientService.openDb();
    const tx = db.transaction(
      [
        AuthClientService.STORE_USERS,
        AuthClientService.STORE_APPOINTMENTS,
        AuthClientService.STORE_MEDICAL_RECORDS,
      ],
      "readwrite"
    );

    const userStore = tx.objectStore(AuthClientService.STORE_USERS);
    const appointmentStore = tx.objectStore(
      AuthClientService.STORE_APPOINTMENTS
    );
    const medicalRecordStore = tx.objectStore(
      AuthClientService.STORE_MEDICAL_RECORDS
    );

    // Check if data already exists to prevent re-adding on every load
    const existingUsersCount = await new Promise<number>((resolve, reject) => {
      const request = userStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (existingUsersCount === 0) {
      // Add mock data only if stores are empty
      for (const user of AuthClientService.initialMockUsers) {
        userStore.put(user);
      }
      for (const app of AuthClientService.initialMockAppointments) {
        appointmentStore.put(app);
      }
      for (const rec of AuthClientService.initialMockMedicalRecords) {
        medicalRecordStore.put(rec);
      }
    }

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log("Mock data initialization/check complete in IndexedDB.");
        resolve();
      };
      tx.onerror = () => {
        console.error("Error initializing mock data:", tx.error);
        reject(tx.error);
      };
    });
  }

  static async syncData() {
    // In a real PWA, this would involve fetching updates from a backend
    // and pushing local changes. For this mock, we'll just ensure data consistency.
    console.log("Simulating data sync...");
    await AuthClientService.initMockData(); // Ensures mock data is present
    console.log("Data sync complete.");
  }

  // --- Authentication ---
  static async login(email: string, password: string): Promise<User> {
    const users = await AuthClientService.getAll<User>(
      AuthClientService.STORE_USERS
    );
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    AuthClientService.currentUser = user;
    localStorage.setItem(
      AuthClientService.CURRENT_USER_KEY,
      JSON.stringify(user)
    );
    return user;
  }

  static async register(
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "synced"> & {
      password: string;
    }
  ): Promise<User> {
    const users = await AuthClientService.getAll<User>(
      AuthClientService.STORE_USERS
    );

    // Check if user already exists
    if (users.some((u) => u.email === userData.email)) {
      throw new Error("User with this email already exists.");
    }

    const newUser: User = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      ...userData,
      // Ensure all properties are defined for Patient/Doctor types
      phone: (userData as Patient).phone || (userData as Doctor).phone || "",
      address:
        (userData as Patient).address || (userData as Doctor).address || "",
      dob: (userData as Patient).dob || "",
      gender: (userData as Patient).gender || "",
      medicalHistory: (userData as Patient).medicalHistory || "",
      specialty: (userData as Doctor).specialty || "",
      bio: (userData as Doctor).bio || "",
    } as User; // Cast to User to satisfy type checker for common properties

    await AuthClientService.putObject(AuthClientService.STORE_USERS, newUser);
    AuthClientService.currentUser = newUser;
    localStorage.setItem(
      AuthClientService.CURRENT_USER_KEY,
      JSON.stringify(newUser)
    );
    return newUser;
  }

  static async logout(): Promise<void> {
    AuthClientService.currentUser = null;
    localStorage.removeItem(AuthClientService.CURRENT_USER_KEY);
  }

  static async getCurrentUser(): Promise<User | null> {
    if (!AuthClientService.currentUser) {
      const storedUser = localStorage.getItem(
        AuthClientService.CURRENT_USER_KEY
      );
      if (storedUser) {
        AuthClientService.currentUser = JSON.parse(storedUser);
      }
    }
    return AuthClientService.currentUser;
  }

  static async isAuthenticated(): Promise<boolean> {
    return (await AuthClientService.getCurrentUser()) !== null;
  }

  // --- User Profile Management ---
  static async updatePatientProfile(updatedPatient: Patient): Promise<Patient> {
    const now = new Date().toISOString();
    const patientToSave = { ...updatedPatient, updatedAt: now, synced: false };
    await AuthClientService.putObject(
      AuthClientService.STORE_USERS,
      patientToSave
    );
    if (AuthClientService.currentUser?.id === patientToSave.id) {
      AuthClientService.currentUser = patientToSave;
      localStorage.setItem(
        AuthClientService.CURRENT_USER_KEY,
        JSON.stringify(patientToSave)
      );
    }
    return patientToSave;
  }

  static async updateDoctorProfile(updatedDoctor: Doctor): Promise<Doctor> {
    const now = new Date().toISOString();
    const doctorToSave = { ...updatedDoctor, updatedAt: now, synced: false };
    await AuthClientService.putObject(
      AuthClientService.STORE_USERS,
      doctorToSave
    );
    if (AuthClientService.currentUser?.id === doctorToSave.id) {
      AuthClientService.currentUser = doctorToSave;
      localStorage.setItem(
        AuthClientService.CURRENT_USER_KEY,
        JSON.stringify(doctorToSave)
      );
    }
    return doctorToSave;
  }

  static async getUserById(id: string): Promise<User | undefined> {
    return AuthClientService.getObject(AuthClientService.STORE_USERS, id);
  }
  static async getDoctorById(id: string): Promise<Doctor | undefined> {
    const user = await AuthClientService.getUserById(id);
    if (user && user.role === "doctor") {
      return user as Doctor;
    }
    return undefined;
  }

  static async getPatientById(id: string): Promise<Patient | undefined> {
    const user = await AuthClientService.getUserById(id);
    if (user && user.role === "patient") {
      return user as Patient;
    }
    return undefined;
  }

  // --- Appointments ---
  static async addAppointment(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">
  ): Promise<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: `app-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await AuthClientService.putObject(
      AuthClientService.STORE_APPOINTMENTS,
      newAppointment
    );
    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("appointmentUpdated", { detail: newAppointment })
    );
    return newAppointment;
  }

  static async getAppointmentById(
    id: string
  ): Promise<Appointment | undefined> {
    return AuthClientService.getObject(
      AuthClientService.STORE_APPOINTMENTS,
      id
    );
  }

  static async getAppointmentsForPatient(
    patientId: string
  ): Promise<Appointment[]> {
    const store = await AuthClientService.getObjectStore(
      AuthClientService.STORE_APPOINTMENTS,
      "readonly"
    );
    const index = store.index("patientId");
    return new Promise((resolve, reject) => {
      const request = index.getAll(patientId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAppointmentsForDoctor(
    doctorId: string
  ): Promise<Appointment[]> {
    const store = await AuthClientService.getObjectStore(
      AuthClientService.STORE_APPOINTMENTS,
      "readonly"
    );
    const index = store.index("doctorId");
    return new Promise((resolve, reject) => {
      const request = index.getAll(doctorId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async updateAppointmentStatus(
    appointmentId: string,
    status: "confirmed" | "cancelled" | "completed" | "pending"
  ): Promise<Appointment> {
    const appointment = await AuthClientService.getObject<Appointment>(
      AuthClientService.STORE_APPOINTMENTS,
      appointmentId
    );
    if (!appointment) throw new Error("Appointment not found");
    const updatedAppointment = {
      ...appointment,
      status,
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await AuthClientService.putObject(
      AuthClientService.STORE_APPOINTMENTS,
      updatedAppointment
    );
    window.dispatchEvent(
      new CustomEvent("appointmentUpdated", { detail: updatedAppointment })
    );
    return updatedAppointment;
  }

  // --- Medical Records ---
  static async addMedicalRecord(
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced">
  ): Promise<MedicalRecord> {
    const newRecord: MedicalRecord = {
      ...record,
      id: `rec-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    await AuthClientService.putObject(
      AuthClientService.STORE_MEDICAL_RECORDS,
      newRecord
    );
    window.dispatchEvent(
      new CustomEvent("medicalRecordUpdated", { detail: newRecord })
    );
    return newRecord;
  }

  static async getMedicalRecordsForPatient(
    patientId: string
  ): Promise<MedicalRecord[]> {
    const store = await AuthClientService.getObjectStore(
      AuthClientService.STORE_MEDICAL_RECORDS,
      "readonly"
    );
    const index = store.index("patientId");
    return new Promise((resolve, reject) => {
      const request = index.getAll(patientId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getMedicalRecordsForDoctor(
    doctorId: string
  ): Promise<MedicalRecord[]> {
    const store = await AuthClientService.getObjectStore(
      AuthClientService.STORE_MEDICAL_RECORDS,
      "readonly"
    );
    const index = store.index("doctorId");
    return new Promise((resolve, reject) => {
      const request = index.getAll(doctorId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Mock Doctor/Patient Data for Display ---
  // --- Mock Doctor/Patient Data for Display ---
  static async getMockDoctors(): Promise<Doctor[]> {
    const users = await AuthClientService.getAll<User>(
      AuthClientService.STORE_USERS
    );
    return users.filter((user) => user.role === "doctor") as Doctor[];
  }

  static async getMockPatients(): Promise<Patient[]> {
    const users = await AuthClientService.getAll<User>(
      AuthClientService.STORE_USERS
    );
    return users.filter((user) => user.role === "patient") as Patient[];
  }
}

// Initialize mock data on client load
if (typeof window !== "undefined") {
  AuthClientService.initMockData().catch(console.error);
}
