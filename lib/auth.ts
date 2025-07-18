import { getLocalDB } from "./db"
import { AuthClientService } from "./auth-client"
import { v4 as uuidv4 } from "uuid"
import type { Patient, Doctor, Appointment, MedicalRecord, User } from "./db"

const authService = new AuthClientService()
const localDB = getLocalDB()

export async function initializeMockData() {
  // Check if mock data already exists to prevent re-adding on every load
  const existingPatients = await localDB.getAllPatients()
  const existingDoctors = await localDB.getAllDoctors()

  if (existingPatients.length > 0 || existingDoctors.length > 0) {
    console.log("Mock data already exists in IndexedDB. Skipping initialization.")
    return
  }

  console.log("Initializing mock data for IndexedDB...")

  try {
    // Mock Doctor
    const doctorId = uuidv4()
    const mockDoctorData: Doctor = {
      id: doctorId,
      name: "Dr. Alice Smith",
      email: "doctor@clinic.com",
      password: "doctor123", // In a real app, hash this!
      phone: "123-456-7890",
      role: "doctor",
      specialization: "General Medicine",
      licenseNumber: "MD12345",
      education: ["MD, University of Health", "Residency, City Hospital"],
      experience: ["10 years as GP", "5 years in virtual care"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }
    await localDB.addDoctor(mockDoctorData)
    authService.updateMockUser(mockDoctorData) // Add to auth service's internal list

    // Mock Patient
    const patientId = uuidv4()
    const mockPatientData: Patient = {
      id: patientId,
      name: "Jane Doe",
      email: "patient@clinic.com",
      password: "patient123", // In a real app, hash this!
      phone: "098-765-4321",
      role: "patient",
      dateOfBirth: "1990-05-15",
      gender: "female",
      address: "123 Main St, Anytown, USA",
      emergencyContact: {
        name: "John Doe",
        phone: "098-111-2222",
        relationship: "Husband",
      },
      medicalHistory: "Asthma, Childhood chickenpox",
      allergies: ["Pollen", "Dust mites"],
      currentMedications: ["Inhaler"],
      bloodType: "A+",
      height: 165,
      weight: 60,
      assignedDoctorIds: [doctorId], // Assign to Dr. Alice Smith
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    }
    await localDB.addPatient(mockPatientData)
    authService.updateMockUser(mockPatientData) // Add to auth service's internal list

    // Mock Appointment
    const appointmentId = uuidv4()
    const mockAppointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced"> = {
      patientId: patientId,
      patientName: mockPatientData.name,
      doctorId: doctorId,
      date: "2025-08-01",
      time: "10:00",
      type: "consultation",
      status: "scheduled",
      notes: "Initial consultation for asthma review.",
    }
    await localDB.addAppointment(mockAppointmentData)

    // Mock Medical Record
    const medicalRecordId = uuidv4()
    const mockMedicalRecordData: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced"> = {
      patientId: patientId,
      patientName: mockPatientData.name,
      doctorId: doctorId,
      date: "2025-07-20",
      diagnosis: "Seasonal Allergies",
      treatment: "Antihistamines, avoid triggers",
      notes: "Patient reported sneezing and itchy eyes.",
    }
    await localDB.addMedicalRecord(mockMedicalRecordData)

    console.log("Mock data initialized successfully.")
  } catch (error) {
    console.error("Error initializing mock data:", error)
  }
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
