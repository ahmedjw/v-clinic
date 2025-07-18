import { openDB, type IDBPDatabase, type DBSchema } from "idb"
import { v4 as uuidv4 } from "uuid"

// Define common base properties for all data types
interface BaseData {
  id: string
  createdAt: string
  updatedAt: string
  synced: boolean // Indicates if the record has been synced with a backend
}

// User types
export interface User extends BaseData {
  name: string
  email: string
  password?: string // Password should ideally not be stored client-side in real apps
  role: "patient" | "doctor"
  avatar?: string
  phone?: string
  address?: string
}

export interface Patient extends User {
  role: "patient"
  dob?: string // Date of Birth (YYYY-MM-DD)
  gender?: string
  medicalHistory?: string
}

export interface Doctor extends User {
  role: "doctor"
  specialty: string
  bio: string
}

export interface Appointment extends BaseData {
  patientId: string
  doctorId: string
  doctorName: string // Denormalized for easier display
  patientName?: string // Denormalized for easier display (for doctor's view)
  patientEmail?: string // Denormalized for easier display (for doctor's view)
  date: string // YYYY-MM-DD
  time: string // HH:MM
  reason: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
}

export interface MedicalRecord extends BaseData {
  patientId: string
  doctorId: string
  patientName?: string // Denormalized for easier display
  diagnosis: string
  treatment: string
  notes?: string
}

// Define the database schema
interface VirtualClinicDB extends DBSchema {
  users: {
    key: string
    value: User
    indexes: { "by-email": string; "by-role": string }
  }
  patients: {
    key: string
    value: Patient
    indexes: { "by-email": string; "by-name": string }
  }
  doctors: {
    key: string
    value: Doctor
    indexes: { "by-email": string; "by-specialization": string }
  }
  appointments: {
    key: string
    value: Appointment
    indexes: { "by-patient": string; "by-doctor": string; "by-date": string }
  }
  medicalRecords: {
    key: string
    value: MedicalRecord
    indexes: { "by-patient": string; "by-doctor": string; "by-date": string }
  }
}

const DB_NAME = "virtual-clinic-db"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<VirtualClinicDB>> | null = null

function initDB() {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = openDB<VirtualClinicDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Users store (for both patients and doctors)
      const userStore = db.createObjectStore("users", { keyPath: "id" })
      userStore.createIndex("by-email", "email", { unique: true })
      userStore.createIndex("by-role", "role")

      // Patients store
      const patientStore = db.createObjectStore("patients", { keyPath: "id" })
      patientStore.createIndex("by-email", "email", { unique: true })
      patientStore.createIndex("by-name", "name")

      // Doctors store
      const doctorStore = db.createObjectStore("doctors", { keyPath: "id" })
      doctorStore.createIndex("by-email", "email", { unique: true })
      doctorStore.createIndex("by-specialization", "specialty")

      // Appointments store
      const appointmentStore = db.createObjectStore("appointments", { keyPath: "id" })
      appointmentStore.createIndex("by-patient", "patientId")
      appointmentStore.createIndex("by-doctor", "doctorId")
      appointmentStore.createIndex("by-date", "date")

      // Medical Records store
      const medicalRecordStore = db.createObjectStore("medicalRecords", { keyPath: "id" })
      medicalRecordStore.createIndex("by-patient", "patientId")
      medicalRecordStore.createIndex("by-doctor", "doctorId")
      medicalRecordStore.createIndex("by-date", "date")
    },
  })
  return dbPromise
}

export class LocalDB {
  private db: IDBPDatabase<VirtualClinicDB> | null = null

  constructor() {
    // The actual DB connection is handled by initDB and getDb
  }

  private async getDb(): Promise<IDBPDatabase<VirtualClinicDB>> {
    if (!this.db) {
      this.db = await initDB()
    }
    return this.db
  }

  // Generic add function
  private async add<T extends BaseData>(
    storeName: keyof VirtualClinicDB,
    data: Omit<T, "id" | "createdAt" | "updatedAt" | "synced">,
  ): Promise<T> {
    const db = await this.getDb()
    const now = new Date().toISOString()
    const record: T = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      synced: false,
      ...data,
    } as T
    await db.add(storeName, record as any) // Cast to any to satisfy idb's put type
    return record
  }

  // Generic update function
  private async update<T extends BaseData>(storeName: keyof VirtualClinicDB, data: T): Promise<T> {
    const db = await this.getDb()
    const now = new Date().toISOString()
    const updatedRecord: T = { ...data, updatedAt: now, synced: false }
    await db.put(storeName, updatedRecord as any) // Cast to any
    return updatedRecord
  }

  // Generic delete function
  private async delete(storeName: keyof VirtualClinicDB, id: string): Promise<void> {
    const db = await this.getDb()
    await db.delete(storeName, id)
  }

  // Generic get all function
  private async getAll<T extends BaseData>(storeName: keyof VirtualClinicDB): Promise<T[]> {
    const db = await this.getDb()
    return (await db.getAll(storeName)) as T[]
  }

  // Generic get by ID function
  private async getById<T extends BaseData>(storeName: keyof VirtualClinicDB, id: string): Promise<T | undefined> {
    const db = await this.getDb()
    return (await db.get(storeName, id)) as T | undefined
  }

  // User operations (for both patients and doctors)
  async addUser(user: Omit<User, "id" | "createdAt" | "updatedAt" | "synced">): Promise<User> {
    return this.add("users", user)
  }

  async updateUser(user: User): Promise<User> {
    return this.update("users", user)
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getById("users", id)
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAll("users")
  }

  // Patient operations
  async addPatient(patient: Omit<Patient, "id" | "createdAt" | "updatedAt" | "synced">): Promise<Patient> {
    const newPatient = await this.add("patients", patient)
    await this.addUser(newPatient) // Also add to generic users store
    return newPatient
  }

  async updatePatient(patient: Patient): Promise<Patient> {
    const updatedPatient = await this.update("patients", patient)
    await this.updateUser(updatedPatient) // Also update in generic users store
    return updatedPatient
  }

  async getPatientById(id: string): Promise<Patient | undefined> {
    return this.getById("patients", id)
  }

  async getAllPatients(): Promise<Patient[]> {
    return this.getAll("patients")
  }

  // Doctor operations
  async addDoctor(doctor: Omit<Doctor, "id" | "createdAt" | "updatedAt" | "synced">): Promise<Doctor> {
    const newDoctor = await this.add("doctors", doctor)
    await this.addUser(newDoctor) // Also add to generic users store
    return newDoctor
  }

  async updateDoctor(doctor: Doctor): Promise<Doctor> {
    const updatedDoctor = await this.update("doctors", doctor)
    await this.updateUser(updatedDoctor) // Also update in generic users store
    return updatedDoctor
  }

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    return this.getById("doctors", id)
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return this.getAll("doctors")
  }

  // Appointment operations
  async addAppointment(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">,
  ): Promise<Appointment> {
    return this.add("appointments", appointment)
  }

  async updateAppointment(appointment: Appointment): Promise<Appointment> {
    return this.update("appointments", appointment)
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    return this.getById("appointments", id)
  }

  async getAppointments(patientId: string): Promise<Appointment[]> {
    const db = await this.getDb()
    return db.getAllFromIndex("appointments", "by-patient", patientId) as Promise<Appointment[]>
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return this.getAll("appointments")
  }

  // Medical Record operations
  async addMedicalRecord(
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced">,
  ): Promise<MedicalRecord> {
    return this.add("medicalRecords", record)
  }

  async updateMedicalRecord(record: MedicalRecord): Promise<MedicalRecord> {
    return this.update("medicalRecords", record)
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecord | undefined> {
    return this.getById("medicalRecords", id)
  }

  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    const db = await this.getDb()
    return db.getAllFromIndex("medicalRecords", "by-patient", patientId) as Promise<MedicalRecord[]>
  }

  async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    return this.getAll("medicalRecords")
  }

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    const db = await this.getDb()
    const tx = db.transaction(["users", "patients", "doctors", "appointments", "medicalRecords"], "readwrite")
    await Promise.all([
      tx.objectStore("users").clear(),
      tx.objectStore("patients").clear(),
      tx.objectStore("doctors").clear(),
      tx.objectStore("appointments").clear(),
      tx.objectStore("medicalRecords").clear(),
    ])
    await tx.done
    console.log("All IndexedDB data cleared.")
  }
}

// Singleton instance of LocalDB
let localDBInstance: LocalDB | null = null

export function getLocalDB(): LocalDB {
  if (!localDBInstance) {
    localDBInstance = new LocalDB()
  }
  return localDBInstance
}
