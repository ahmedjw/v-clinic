"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth-guard"
import { PatientForm } from "@/components/patient-form"
import { AppointmentForm } from "@/components/appointment-form"
import { SyncStatus } from "@/components/sync-status"
import { localDB, type Patient, type Appointment } from "@/lib/db"
import { Calendar, Users, Clock, Plus, CheckCircle, XCircle } from "lucide-react"

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await localDB.init()
      await loadData()
    } catch (error) {
      console.error("Failed to initialize app:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [patientsData, appointmentsData] = await Promise.all([localDB.getPatients(), localDB.getAppointments()])
      setPatients(patientsData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    }
  }

  const handleAddPatient = async (patientData: Omit<Patient, "id" | "createdAt" | "updatedAt" | "synced">) => {
    try {
      await localDB.addPatient(patientData)
      await loadData()
      setShowPatientForm(false)
    } catch (error) {
      console.error("Failed to add patient:", error)
    }
  }

  const handleAddAppointment = async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">,
  ) => {
    try {
      await localDB.addAppointment(appointmentData)
      await loadData()
      setShowAppointmentForm(false)
    } catch (error) {
      console.error("Failed to add appointment:", error)
    }
  }

  const handleUpdateAppointmentStatus = async (id: string, status: Appointment["status"]) => {
    try {
      await localDB.updateAppointmentStatus(id, status)
      await loadData()
    } catch (error) {
      console.error("Failed to update appointment:", error)
    }
  }

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "scheduled":
        return "default"
      case "completed":
        return "default"
      case "cancelled":
        return "secondary"
      default:
        return "default"
    }
  }

  const getTypeColor = (type: Appointment["type"]) => {
    switch (type) {
      case "consultation":
        return "default"
      case "follow-up":
        return "secondary"
      case "emergency":
        return "destructive"
      default:
        return "default"
    }
  }

  const todayAppointments = appointments.filter((apt) => apt.date === new Date().toISOString().split("T")[0])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your virtual clinic</p>
          </div>
          <SyncStatus />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Appointments</h2>
              <Button onClick={() => setShowAppointmentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>

            {showAppointmentForm && (
              <AppointmentForm
                patients={patients}
                onSubmit={handleAddAppointment}
                onCancel={() => setShowAppointmentForm(false)}
              />
            )}

            <div className="grid gap-4">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No appointments scheduled</p>
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{appointment.patientName}</h3>
                            <Badge variant={getTypeColor(appointment.type)}>{appointment.type}</Badge>
                            <Badge variant={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                          </p>
                          {appointment.notes && <p className="text-sm text-gray-700">{appointment.notes}</p>}
                        </div>
                        <div className="flex space-x-2">
                          {appointment.status === "scheduled" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, "completed")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateAppointmentStatus(appointment.id, "cancelled")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Patients</h2>
              <Button onClick={() => setShowPatientForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>

            {showPatientForm && <PatientForm onSubmit={handleAddPatient} onCancel={() => setShowPatientForm(false)} />}

            <div className="grid gap-4">
              {patients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No patients registered</p>
                  </CardContent>
                </Card>
              ) : (
                patients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{patient.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Email: {patient.email}</p>
                          <p>Phone: {patient.phone}</p>
                          <p>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                          {patient.medicalHistory && <p>Medical History: {patient.medicalHistory}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
