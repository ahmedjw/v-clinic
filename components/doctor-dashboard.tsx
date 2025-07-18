"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedPatientForm } from "@/components/enhanced-patient-form"
import { AppointmentForm } from "@/components/appointment-form"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { getLocalDB, type Patient, type Appointment, type MedicalRecord, type User } from "@/lib/db"
import { Calendar, Users, Plus, FileText, Activity, MessageSquare, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientProfileModal } from "./patient-profile-modal"
import { MockChat } from "./mock-chat"
import { UserSettingsForm } from "./user-settings-form"
import { ShareAppointmentModal } from "./share-appointment-modal"

interface DoctorDashboardProps {
  user: User
}

export function DoctorDashboard({ user }: DoctorDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [showChatModal, setShowChatModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [appointmentToShare, setAppointmentToShare] = useState<Appointment | null>(null)
  const [recipientPhone, setRecipientPhone] = useState<string | null>(null) // NEW: State for recipient phone

  useEffect(() => {
    loadData()
  }, [user.id])

  const loadData = async () => {
    try {
      const localDB = getLocalDB()
      const [patientsData, appointmentsData, recordsData] = await Promise.all([
        localDB.getPatients(user.id),
        localDB.getAppointments(undefined, user.id),
        localDB.getMedicalRecords(undefined, user.id),
      ])
      setPatients(patientsData)
      setAppointments(appointmentsData)
      setMedicalRecords(recordsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async (patientData: Omit<Patient, "id" | "createdAt" | "updatedAt" | "synced">) => {
    try {
      const localDB = getLocalDB()
      const patientWithDoctor = {
        ...patientData,
        assignedDoctorIds: [...(patientData.assignedDoctorIds || []), user.id],
        id: crypto.randomUUID(), // Generate a unique id for the new patient
      }
      await localDB.addPatient(patientWithDoctor)
      await loadData()
      setShowPatientForm(false)
    } catch (error) {
      console.error("Failed to add patient:", error)
    }
  }

  const handleAddAppointment = async (appointmentData: any) => {
    try {
      const localDB = getLocalDB()
      const newAppointment = await localDB.addAppointment({ ...appointmentData, doctorId: user.id })
      await loadData()
      setShowAppointmentForm(false)
      // NEW: Fetch patient phone for sharing
      const patient = patients.find((p) => p.id === newAppointment.patientId)
      setRecipientPhone(patient?.phone || null)
      setAppointmentToShare(newAppointment)
    } catch (error) {
      console.error("Failed to add appointment:", error)
    }
  }

  const handleAddMedicalRecord = async (recordData: any) => {
    try {
      const localDB = getLocalDB()
      await localDB.addMedicalRecord({ ...recordData, doctorId: user.id })
      await loadData()
      setShowMedicalRecordForm(false)
      setSelectedPatient(null)
    } catch (error) {
      console.error("Failed to add medical record:", error)
    }
  }

  const handleViewPatientProfile = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const handleClosePatientProfile = () => {
    setSelectedPatient(null)
  }

  const handleUpdateUser = async (updatedUserData: Partial<User & Patient>) => {
    try {
      const localDB = getLocalDB()
      const currentUser = await localDB.getCurrentUser()
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updatedUserData }
        await localDB.setCurrentUser(updatedUser)
        console.log("User updated:", updatedUser)
        setShowSettings(false)
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    }
  }

  const handleShareAppointmentClick = async (appointment: Appointment) => {
    const localDB = getLocalDB()
    const patient = await localDB.getPatientById(appointment.patientId)
    setRecipientPhone(patient?.phone || null)
    setAppointmentToShare(appointment)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const todayAppointments = appointments.filter((apt) => apt.date === new Date().toISOString().split("T")[0])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      patient.phone.includes(patientSearchTerm),
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600">Welcome back, Dr. {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">My Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{todayAppointments.length}</div>
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
            <CardTitle className="text-xs sm:text-sm font-medium">Active Cases</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {appointments.filter((apt) => apt.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments" className="text-xs sm:text-sm">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="patients" className="text-xs sm:text-sm">
            Patients
          </TabsTrigger>
          <TabsTrigger value="records" className="text-xs sm:text-sm">
            Records
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1" /> My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">Appointments</h2>
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
            <Button onClick={() => setShowAppointmentForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>

          {showAppointmentForm && (
            <AppointmentForm
              patients={patients}
              onSubmit={handleAddAppointment}
              onCancel={() => setShowAppointmentForm(false)}
              currentUser={user}
            />
          )}

          <div className="space-y-4">
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
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{appointment.patientName}</h3>
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
                          onClick={() => {
                            const patient = patients.find((p) => p.id === appointment.patientId)
                            if (patient) {
                              setSelectedPatient(patient)
                              setShowMedicalRecordForm(true)
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Add Record
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChatModal(true)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
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

        <TabsContent value="patients" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg sm:text-xl font-semibold">My Patients</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search patients by name or email..."
                  className="w-full"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                />
              </div>
              <Select>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="recent">Recent Visits</SelectItem>
                  <SelectItem value="upcoming">Upcoming Appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowPatientForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>

          {showPatientForm && (
            <EnhancedPatientForm
              onSubmit={handleAddPatient}
              onCancel={() => setShowPatientForm(false)}
              currentUser={user}
            />
          )}

          <div className="grid gap-4">
            {filteredPatients.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No patients found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              filteredPatients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold">{patient.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Email: {patient.email}</p>
                          <p>Phone: {patient.phone}</p>
                          <p>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                          <p>Gender: {patient.gender}</p>
                          {patient.allergies?.length > 0 && <p>Allergies: {patient.allergies.join(", ")}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPatientProfile(patient)}
                          className="w-full sm:w-auto"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPatient(patient)
                            setShowMedicalRecordForm(true)
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Record
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChatModal(true)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
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
          <h2 className="text-lg sm:text-xl font-semibold">Medical Records</h2>
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
                            {patients.find((p) => p.id === record.patientId)?.name || "Unknown Patient"}
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
          <UserSettingsForm currentUser={user} onSave={handleUpdateUser} />
        </TabsContent>
      </Tabs>

      {showMedicalRecordForm && selectedPatient && (
        <MedicalRecordForm
          patient={selectedPatient}
          onSubmit={handleAddMedicalRecord}
          onCancel={() => {
            setShowMedicalRecordForm(false)
            setSelectedPatient(null)
          }}
          currentUser={user}
        />
      )}

      {selectedPatient && <PatientProfileModal patient={selectedPatient} onClose={handleClosePatientProfile} />}

      {showChatModal && <MockChat onClose={() => setShowChatModal(false)} />}

      {appointmentToShare && (
        <ShareAppointmentModal
          appointment={appointmentToShare}
          onClose={() => setAppointmentToShare(null)}
          senderRole={user.role}
          recipientPhoneNumber={recipientPhone} // Pass recipient phone number
        />
      )}
    </div>
  )
}
