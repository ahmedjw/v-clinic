export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: string;
  allergies: string[];
  currentMedications: string[];
  bloodType?: string;
  height?: number; // in cm
  weight?: number; // in kg
  assignedDoctorIds: string[]; // NEW: Array of doctor IDs assigned to this patient
  createdAt: string;
  updatedAt: string;
  synced: boolean; // Keep synced property for potential future server integration
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string; // Ensure doctorId is always present
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency";
  status: "scheduled" | "completed" | "cancelled" | "requested"; // ADDED 'requested' status
  notes: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string; // Ensure doctorId is always present
  date: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescription: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  vitals: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  notes: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

// User interface for IndexedDB, matching AuthClientService's User
export interface User {
  id: string;
  email: string;
  name: string;
  role: "doctor" | "patient";
  phone?: string;
  specialization?: string; // for doctors
  licenseNumber?: string; // for doctors
  patientId?: string; // for patients - links to Patient record
  createdAt: string;
}

class LocalDB {
  private dbName = "VirtualClinicDB";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || !window.indexedDB) {
      throw new Error("IndexedDB is not available");
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Patients store
        if (!db.objectStoreNames.contains("patients")) {
          const patientsStore = db.createObjectStore("patients", {
            keyPath: "id",
          });
          patientsStore.createIndex("email", "email", { unique: true });
          patientsStore.createIndex("synced", "synced");
          patientsStore.createIndex("assignedDoctorIds", "assignedDoctorIds", {
            multiEntry: true,
          }); // NEW INDEX
        }

        // Appointments store
        if (!db.objectStoreNames.contains("appointments")) {
          const appointmentsStore = db.createObjectStore("appointments", {
            keyPath: "id",
          });
          appointmentsStore.createIndex("patientId", "patientId");
          appointmentsStore.createIndex("doctorId", "doctorId"); // NEW INDEX
          appointmentsStore.createIndex("date", "date");
          appointmentsStore.createIndex("synced", "synced");
        }

        // Users store (for current logged-in user session)
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" });
        }

        // Sync queue store (no longer used for server sync, but can be kept for local "pending" actions)
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("timestamp", "timestamp");
        }

        // Medical Records store
        if (!db.objectStoreNames.contains("medicalRecords")) {
          const recordsStore = db.createObjectStore("medicalRecords", {
            keyPath: "id",
          });
          recordsStore.createIndex("patientId", "patientId");
          recordsStore.createIndex("doctorId", "doctorId"); // NEW INDEX
          recordsStore.createIndex("date", "date");
          recordsStore.createIndex("synced", "synced");
        }
      };
    });
  }

  async addPatient(
    patient: Omit<Patient, "createdAt" | "updatedAt" | "synced"> & {
      id?: string;
    }
  ): Promise<Patient> {
    if (!this.db) throw new Error("Database not initialized");

    const newPatient: Patient = {
      ...patient,
      id: patient.id || crypto.randomUUID(), // Allow passing ID for mock patient creation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true, // Always true for client-only mode
    };

    const transaction = this.db.transaction(["patients"], "readwrite");
    const patientsStore = transaction.objectStore("patients");

    await patientsStore.add(newPatient);
    return newPatient;
  }

  async getPatients(doctorId?: string): Promise<Patient[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["patients"], "readonly");
    const store = transaction.objectStore("patients");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const patients = request.result;
        if (doctorId) {
          // Filter patients assigned to this doctor
          resolve(
            patients.filter((p) => p.assignedDoctorIds.includes(doctorId))
          );
        } else {
          resolve(patients);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["patients"], "readonly");
    const store = transaction.objectStore("patients");

    return new Promise((resolve, reject) => {
      const request = store.get(patientId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePatient(patient: Patient): Promise<Patient> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["patients"], "readwrite");
    const store = transaction.objectStore("patients");

    const updatedPatient = {
      ...patient,
      updatedAt: new Date().toISOString(),
      synced: true,
    };

    await store.put(updatedPatient);
    return updatedPatient;
  }

  async addAppointment(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">
  ): Promise<Appointment> {
    if (!this.db) throw new Error("Database not initialized");

    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true, // Always true for client-only mode
    };

    const transaction = this.db.transaction(["appointments"], "readwrite");
    const appointmentsStore = transaction.objectStore("appointments");

    await appointmentsStore.add(newAppointment);
    return newAppointment;
  }

  async getAppointments(
    patientId?: string,
    doctorId?: string
  ): Promise<Appointment[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["appointments"], "readonly");
    const store = transaction.objectStore("appointments");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let appointments = request.result;
        if (patientId) {
          appointments = appointments.filter(
            (apt) => apt.patientId === patientId
          );
        }
        if (doctorId) {
          appointments = appointments.filter(
            (apt) => apt.doctorId === doctorId
          );
        }
        resolve(appointments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateAppointmentStatus(
    id: string,
    status: Appointment["status"],
    notes?: string
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["appointments"], "readwrite");
    const appointmentsStore = transaction.objectStore("appointments");

    const appointment = await new Promise<Appointment>((resolve, reject) => {
      const request = appointmentsStore.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (appointment) {
      appointment.status = status;
      appointment.updatedAt = new Date().toISOString();
      appointment.synced = true; // Always true for client-only mode
      if (notes) appointment.notes = notes;

      await appointmentsStore.put(appointment);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["users"], "readonly");
    const store = transaction.objectStore("users");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const users = request.result;
        resolve(users.length > 0 ? users[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setCurrentUser(user: User): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["users"], "readwrite");
    const store = transaction.objectStore("users");

    // Clear existing users and set new one
    await store.clear();
    await store.add(user);
  }

  async clearCurrentUser(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["users"], "readwrite");
    const store = transaction.objectStore("users");
    await store.clear();
  }

  async addMedicalRecord(
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced">
  ): Promise<MedicalRecord> {
    if (!this.db) throw new Error("Database not initialized");

    const newRecord: MedicalRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true, // Always true for client-only mode
    };

    const transaction = this.db.transaction(["medicalRecords"], "readwrite");
    const recordsStore = transaction.objectStore("medicalRecords");

    await recordsStore.add(newRecord);
    return newRecord;
  }

  async getMedicalRecords(
    patientId?: string,
    doctorId?: string
  ): Promise<MedicalRecord[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["medicalRecords"], "readonly");
    const store = transaction.objectStore("medicalRecords");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let records = request.result;
        if (patientId) {
          records = records.filter((record) => record.patientId === patientId);
        }
        if (doctorId) {
          records = records.filter((record) => record.doctorId === doctorId);
        }
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue methods are no longer relevant for server sync, but can be kept if needed for local "pending" states
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["syncQueue"], "readonly");
    const store = transaction.objectStore("syncQueue");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");
    await store.clear();
  }
}

// Create a singleton instance that's only initialized on the client
let localDBInstance: LocalDB | null = null;

export const getLocalDB = (): LocalDB => {
  if (typeof window === "undefined") {
    throw new Error("LocalDB can only be used in browser environment");
  }

  if (!localDBInstance) {
    localDBInstance = new LocalDB();
  }

  return localDBInstance;
};

// For backward compatibility (if any components still use localDB directly)
export const localDB = {
  init: () => {
    if (typeof window === "undefined")
      return Promise.reject(new Error("Not in browser"));
    return getLocalDB().init();
  },
  addPatient: (
    patient: Omit<Patient, "createdAt" | "updatedAt" | "synced"> & {
      id?: string;
    }
  ) => {
    return getLocalDB().addPatient(patient);
  },
  getPatients: (doctorId?: string) => {
    return getLocalDB().getPatients(doctorId);
  },
  getPatientById: (patientId: string) => {
    return getLocalDB().getPatientById(patientId);
  },
  updatePatient: (patient: Patient) => {
    return getLocalDB().updatePatient(patient);
  },
  addAppointment: (
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">
  ) => {
    return getLocalDB().addAppointment(appointment);
  },
  getAppointments: (patientId?: string, doctorId?: string) => {
    return getLocalDB().getAppointments(patientId, doctorId);
  },
  updateAppointmentStatus: (
    id: string,
    status: Appointment["status"],
    notes?: string
  ) => {
    return getLocalDB().updateAppointmentStatus(id, status, notes);
  },
  getCurrentUser: () => {
    return getLocalDB().getCurrentUser();
  },
  setCurrentUser: (user: User) => {
    return getLocalDB().setCurrentUser(user);
  },
  clearCurrentUser: () => {
    return getLocalDB().clearCurrentUser();
  },
  getSyncQueue: () => {
    return getLocalDB().getSyncQueue();
  },
  clearSyncQueue: () => {
    return getLocalDB().clearSyncQueue();
  },
  addMedicalRecord: (
    record: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced">
  ) => {
    return getLocalDB().addMedicalRecord(record);
  },
  getMedicalRecords: (patientId?: string, doctorId?: string) => {
    return getLocalDB().getMedicalRecords(patientId, doctorId);
  },
};
