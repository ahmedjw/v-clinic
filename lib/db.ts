export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  medicalHistory: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency";
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "doctor" | "nurse" | "admin";
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
        }

        // Appointments store
        if (!db.objectStoreNames.contains("appointments")) {
          const appointmentsStore = db.createObjectStore("appointments", {
            keyPath: "id",
          });
          appointmentsStore.createIndex("patientId", "patientId");
          appointmentsStore.createIndex("date", "date");
          appointmentsStore.createIndex("synced", "synced");
        }

        // Users store
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("timestamp", "timestamp");
        }
      };
    });
  }

  async addPatient(
    patient: Omit<Patient, "id" | "createdAt" | "updatedAt" | "synced">
  ): Promise<Patient> {
    if (!this.db) throw new Error("Database not initialized");

    const newPatient: Patient = {
      ...patient,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    const transaction = this.db.transaction(
      ["patients", "syncQueue"],
      "readwrite"
    );
    const patientsStore = transaction.objectStore("patients");
    const syncStore = transaction.objectStore("syncQueue");

    await patientsStore.add(newPatient);
    await syncStore.add({
      type: "CREATE_PATIENT",
      data: newPatient,
      timestamp: Date.now(),
    });

    return newPatient;
  }

  async getPatients(): Promise<Patient[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["patients"], "readonly");
    const store = transaction.objectStore("patients");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
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
      synced: false,
    };

    const transaction = this.db.transaction(
      ["appointments", "syncQueue"],
      "readwrite"
    );
    const appointmentsStore = transaction.objectStore("appointments");
    const syncStore = transaction.objectStore("syncQueue");

    await appointmentsStore.add(newAppointment);
    await syncStore.add({
      type: "CREATE_APPOINTMENT",
      data: newAppointment,
      timestamp: Date.now(),
    });

    return newAppointment;
  }

  async getAppointments(): Promise<Appointment[]> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(["appointments"], "readonly");
    const store = transaction.objectStore("appointments");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateAppointmentStatus(
    id: string,
    status: Appointment["status"],
    notes?: string
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction(
      ["appointments", "syncQueue"],
      "readwrite"
    );
    const appointmentsStore = transaction.objectStore("appointments");
    const syncStore = transaction.objectStore("syncQueue");

    const appointment = await new Promise<Appointment>((resolve, reject) => {
      const request = appointmentsStore.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (appointment) {
      appointment.status = status;
      appointment.updatedAt = new Date().toISOString();
      appointment.synced = false;
      if (notes) appointment.notes = notes;

      await appointmentsStore.put(appointment);
      await syncStore.add({
        type: "UPDATE_APPOINTMENT",
        data: appointment,
        timestamp: Date.now(),
      });
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

// For backward compatibility
export const localDB = {
  init: () => {
    if (typeof window === "undefined")
      return Promise.reject(new Error("Not in browser"));
    return getLocalDB().init();
  },
  addPatient: (
    patient: Omit<Patient, "id" | "createdAt" | "updatedAt" | "synced">
  ) => {
    return getLocalDB().addPatient(patient);
  },
  getPatients: () => {
    return getLocalDB().getPatients();
  },
  addAppointment: (
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">
  ) => {
    return getLocalDB().addAppointment(appointment);
  },
  getAppointments: () => {
    return getLocalDB().getAppointments();
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
};
