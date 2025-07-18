"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Calendar, Users, FileText, MessageSquare, Settings, LogOut, Search } from "lucide-react"
import type { Appointment, Patient, MedicalRecord, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { AppointmentForm } from "@/components/appointment-form"
import { PatientForm } from "@/components/patient-form"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { PatientProfileModal } from "@/components/patient-profile-modal"
import { DoctorProfileModal } from "@/components/doctor-profile-modal"
import { UserSettingsForm } from "@/components/user-settings-form"
import { AuthClientService } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { MockChat } from "@/components/mock-chat"
import { SyncStatus } from "@/components/sync-status"
import { useToast } from "@/hooks/use-toast"
import { ShareAppointmentModal } from "@/components/share-appointment-modal"
import { Input } from "@/components/ui/input"

interface DoctorDashboardProps {
  doctor: User
}

export function DoctorDashboard({ doctor }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState("appointments")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formType, setFormType] = useState<"appointment" | "patient" | "medicalRecord" | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDoctorProfileModalOpen, setIsDoctorProfileModalOpen] = useState(false)
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [appointmentToShare, setAppointmentToShare] = useState<Appointment | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const router = useRouter()
  const authService = new AuthClientService()
  const { toast } = useToast()

  const loadData = async () => {
    const localDB = getLocalDB()
    const allAppointments = await localDB.getAllAppointments()
    const allPatients = await localDB.getAllPatients()
    const allMedicalRecords = await localDB.getAllMedicalRecords()

    // Filter appointments and medical records relevant to this doctor
    const doctorAppointments = allAppointments.filter((apt) => apt.doctorId === doctor.id || apt.status === "pending")
    const doctorMedicalRecords = allMedicalRecords.filter((rec) => rec.doctorId === doctor.id)

    setAppointments(doctorAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    setPatients(allPatients.sort((a, b) => a.name.localeCompare(b.name)))
    setMedicalRecords(doctorMedicalRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  useEffect(() => {
    loadData()
  }, [doctor.id])

  const handleOpenForm = (type: "appointment" | "patient" | "medicalRecord", data: any = null) => {
    setFormType(type)
    setEditingData(data)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingData(null)
    setFormType(null)
    loadData() // Reload data after form submission/cancellation
  }

  const handleViewPatientProfile = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const handleClosePatientProfile = () => {
    setSelectedPatient(null)
  }

  const handleLogout = async () => {
    await authService.logout()
    router.push("/login")
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const handleShareAppointment = (appointment: Appointment) => {
    setAppointmentToShare(appointment)
    setIsShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false)
    setAppointmentToShare(null)
  }

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMedicalRecords = medicalRecords.filter(
    (record) =>
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Virtual Clinic - Doctor Dashboard</h1>
        <div className="flex items-center gap-4">
          <SyncStatus />
          <Button variant="outline" onClick={() => setIsUserSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <TabsList className="grid w-full md:w-auto grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Appointments
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Patients
              </TabsTrigger>
              <TabsTrigger value="medicalRecords" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Records
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Chat
              </TabsTrigger>
            </TabsList>
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative w-full md:w-auto">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              <Button onClick={() => handleOpenForm("appointment")}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add Appointment
              </Button>
            </div>
          </div>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.patientName}</TableCell>
                          <TableCell>{new Date(apt.date).toLocaleDateString()}</TableCell>
                          <TableCell>{apt.time}</TableCell>
                          <TableCell>{apt.type}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                apt.status === "scheduled"
                                  ? "default"
                                  : apt.status === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {apt.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 bg-transparent"
                              onClick={() => handleOpenForm("appointment", apt)}
                            >
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleShareAppointment(apt)}>
                              Share
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No appointments found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Patient List</CardTitle>
                <Button onClick={() => handleOpenForm("patient")}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Patient
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>{patient.email}</TableCell>
                          <TableCell>{patient.phone}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 bg-transparent"
                              onClick={() => handleViewPatientProfile(patient)}
                            >
                              View Profile
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleOpenForm("patient", patient)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No patients found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medicalRecords">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Medical Records</CardTitle>
                <Button onClick={() => handleOpenForm("medicalRecord")}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Record
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedicalRecords.length > 0 ? (
                      filteredMedicalRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.patientName}</TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell>{record.treatment}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenForm("medicalRecord", record)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No medical records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Mock Chat Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <MockChat currentUser={doctor} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {isFormOpen && formType === "appointment" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <AppointmentForm initialData={editingData} onSave={handleCloseForm} onCancel={handleCloseForm} />
        </div>
      )}
      {isFormOpen && formType === "patient" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PatientForm initialData={editingData} onSave={handleCloseForm} onCancel={handleCloseForm} />
        </div>
      )}
      {isFormOpen && formType === "medicalRecord" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <MedicalRecordForm
            initialData={editingData}
            onSave={handleCloseForm}
            onCancel={handleCloseForm}
            doctorId={doctor.id}
          />
        </div>
      )}

      {selectedPatient && <PatientProfileModal patient={selectedPatient} onClose={handleClosePatientProfile} />}

      {isDoctorProfileModalOpen && (
        <DoctorProfileModal doctor={doctor} onClose={() => setIsDoctorProfileModalOpen(false)} />
      )}

      {isUserSettingsOpen && (
        <UserSettingsForm user={doctor} onClose={() => setIsUserSettingsOpen(false)} onSave={loadData} />
      )}

      {isShareModalOpen && appointmentToShare && (
        <ShareAppointmentModal
          appointment={appointmentToShare}
          patient={patients.find((p) => p.id === appointmentToShare.patientId)}
          onClose={handleCloseShareModal}
        />
      )}
    </div>
  )
}
