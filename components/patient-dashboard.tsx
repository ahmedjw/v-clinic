"use client"
/*eslint-disable*/

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getLocalDB, type Patient, type Appointment, type MedicalRecord, type User, Doctor } from "@/lib/db"
import { Calendar, FileText, Activity, MessageSquare, Settings, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppointmentRequestForm } from "./appointment-request-form" // NEW: Import AppointmentRequestForm
import { UserSettingsForm } from "./user-settings-form" // NEW: Import UserSettingsForm
import { ShareAppointmentModal } from "./share-appointment-modal" // NEW: Import ShareAppointmentModal
import { getAuthClientService } from "@/lib/auth-client" // NEW: Import AuthClientService
import { MockChat } from "./mock-chat" // NEW: Import MockChat

interface PatientDashboardProps {
  user: Patient
}

export function PatientDashboard({ user }: PatientDashboardProps) {
  const [patientData, setPatientData] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAppointmentRequestForm, setShowAppointmentRequestForm] = useState(false) // NEW: State for request form
  const [showChatModal, setShowChatModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false) // NEW: State for showing settings form
  const [appointmentToShare, setAppointmentToShare] = useState<Appointment | null>(null) // NEW: State for sharing appointment
  const [recipientPhone, setRecipientPhone] = useState<string | null>(null) // NEW: State for recipient phone

  const authService = getAuthClientService() // NEW: Get auth service

  useEffect(() => {
    loadData()
  }, [user.id])

  const loadData = async () => {
    try {
      const localDB = getLocalDB()
      const currentPatient = await localDB.getPatientById((user as Patient).id)
      setPatientData(currentPatient ?? null)

      if (currentPatient) {
        const [appointmentsData, recordsData] = await Promise.all([
          localDB.getAppointments(currentPatient.id),
          localDB.getMedicalRecords(currentPatient.id),
        ])
        setAppointments(appointmentsData)
        setMedicalRecords(recordsData)
      }
    } catch (error) {
      console.error("Failed to load patient data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAppointment = async (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">,
  ) => {
    try {
      const localDB = getLocalDB()
      const newAppointment = await localDB.addAppointment(appointmentData)
      await loadData()
      setShowAppointmentRequestForm(false)
      // NEW: Fetch doctor phone for sharing
      const doctor = authService.getMockUsers().find((u: User) => u.id === newAppointment.doctorId)
      setRecipientPhone(doctor?.phone || null)
      setAppointmentToShare(newAppointment)
    } catch (error) {
      console.error("Failed to request appointment:", error)
    }
  }

  const handleUpdateUser = async (updatedUserData: Partial<User & Patient>) => {
    try {
      const localDB = getLocalDB()
      const currentPatient = await localDB.getPatientById(user.id)
      if (currentPatient) {
        const updatedUser = { ...currentPatient, ...updatedUserData }
        await localDB.updatePatient(updatedUser as Patient)
        setPatientData(updatedUser as Patient) // Update local state

        console.log("User updated:", updatedUser)
        setShowSettings(false)
        window.location.reload() // Simple reload to reflect changes in header
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    }
  }

  const handleShareAppointmentClick = async (appointment: Appointment) => {
    const doctor = authService.getMockUsers().find((u: User) => u.id === appointment.doctorId)
    setRecipientPhone(doctor?.phone || null)
    setAppointmentToShare(appointment)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Patient data not found. Please ensure your account is linked to a patient record.</p>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled" || apt.status === "requested")
  const completedAppointments = appointments.filter((apt) => apt.status === "completed")

  const allDoctors = authService.getMockUsers().filter((u: User) => u.role === "doctor")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600">Welcome, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{medicalRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed Appointments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{completedAppointments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">5</div> {/* Mock value */}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments" className="text-xs sm:text-sm">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="records" className="text-xs sm:text-sm">
            Medical Records
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1" /> My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">My Appointments</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input placeholder="Search appointments..." className="w-full" />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Appointments</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowAppointmentRequestForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Request Appointment
            </Button>
          </div>

          {showAppointmentRequestForm && (
            <AppointmentRequestForm
              patientId={patientData.id} // Pass only the current patient ID
              doctors={allDoctors} // Pass all available doctors
              onSubmit={handleRequestAppointment}
              onCancel={() => setShowAppointmentRequestForm(false)}
              currentUser={user}
            />
          )}

          <div className="space-y-4">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments scheduled.</p>
                </CardContent>
              </Card>
            ) : (
              appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {authService.getMockUsers().find((d: User) => d.id === appointment.doctorId)?.name ||
                              "Unknown Doctor"}
                          </h3>
                          <Badge variant="outline">{appointment.type}</Badge>
                          <Badge
                            variant={
                              appointment.status === "scheduled"
                                ? "default"
                                : appointment.status === "requested"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        </p>
                        {appointment.notes && <p className="text-sm text-gray-700">{appointment.notes}</p>}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChatModal(true)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message Doctor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareAppointmentClick(appointment)} // Call new handler
                          className="w-full sm:w-auto"
                        >
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">My Medical Records</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input placeholder="Search records..." className="w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="diagnosis">By Diagnosis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {medicalRecords.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medical records available.</p>
                </CardContent>
              </Card>
            ) : (
              medicalRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {authService.getMockUsers().find((d: User) => d.id === record.doctorId)?.name || "Unknown Doctor"}
                          </h3>
                          <span className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </p>
                        <p>
                          <strong>Symptoms:</strong> {record.symptoms.join(", ")}
                        </p>
                        <p>
                          <strong>Treatment:</strong> {record.treatment}
                        </p>

                        {record.prescription.length > 0 && (
                          <div>
                            <strong>Prescriptions:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {record.prescription.map((med, index) => (
                                <li key={index}>
                                  {med.medication} - {med.dosage}, {med.frequency} for {med.duration}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {record.notes && (
                          <p>
                            <strong>Notes:</strong> {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">My Profile Settings</h2>
          <UserSettingsForm currentUser={user} patient={patientData} onSave={handleUpdateUser} />
        </TabsContent>
      </Tabs>

      {showChatModal && <MockChat onClose={() => setShowChatModal(false)} />}

      {appointmentToShare && (
        <ShareAppointmentModal
          appointment={appointmentToShare}
          onClose={() => setAppointmentToShare(null)}
          senderRole={(user as User).role}
          recipientPhoneNumber={recipientPhone} // Pass recipient phone number
        />
      )}
    </div>
  )
}
