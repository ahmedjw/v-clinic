"use client"

import { useEffect, useState } from "react"
import { AuthClientService } from "@/lib/auth-client"
import type { Appointment, Patient, MedicalRecord, Doctor } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, User2 } from "lucide-react"
import { AppointmentForm } from "@/components/appointment-form"
import { DoctorCard } from "@/components/doctor-card"
import { ShareAppointmentModal } from "@/components/share-appointment-modal"
import { useToast } from "@/components/ui/use-toast"
import { PatientProfileModal } from "./patient-profile-modal"
import { MockChat } from "./mock-chat"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { UserSettingsForm } from "./user-settings-form"

interface PatientDashboardProps {
  patient: Patient
}

export function PatientDashboard({ patient }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("appointments")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedDoctorToShare, setSelectedDoctorToShare] = useState<Doctor | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchPatientData = async () => {
      const fetchedAppointments = await AuthClientService.getAppointmentsForPatient(patient.id)
      setAppointments(fetchedAppointments)
      const fetchedRecords = await AuthClientService.getMedicalRecordsForPatient(patient.id)
      setMedicalRecords(fetchedRecords)
      const fetchedDoctors = await AuthClientService.getMockDoctors()
      setDoctors(fetchedDoctors)
    }
    fetchPatientData()

    const handleAppointmentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Appointment>
      if (customEvent.detail.patientId === patient.id) {
        setAppointments((prev) => {
          const existingIndex = prev.findIndex((app) => app.id === customEvent.detail.id)
          if (existingIndex > -1) {
            return prev.map((app, idx) => (idx === existingIndex ? customEvent.detail : app))
          }
          return [...prev, customEvent.detail]
        })
      }
    }

    const handleMedicalRecordUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<MedicalRecord>
      if (customEvent.detail.patientId === patient.id) {
        setMedicalRecords((prev) => {
          const existingIndex = prev.findIndex((rec) => rec.id === customEvent.detail.id)
          if (existingIndex > -1) {
            return prev.map((rec, idx) => (idx === existingIndex ? customEvent.detail : rec))
          }
          return [...prev, customEvent.detail]
        })
      }
    }

    window.addEventListener("appointmentUpdated", handleAppointmentUpdate as EventListener)
    window.addEventListener("medicalRecordUpdated", handleMedicalRecordUpdate as EventListener)

    return () => {
      window.removeEventListener("appointmentUpdated", handleAppointmentUpdate as EventListener)
      window.removeEventListener("medicalRecordUpdated", handleMedicalRecordUpdate as EventListener)
    }
  }, [patient.id])

  const handleAppointmentCreated = (newAppointment: Appointment) => {
    setAppointments((prev) => [...prev, newAppointment])
  }

  const handleShareDoctorProfile = (doctorToShare: Doctor) => {
    setSelectedDoctorToShare(doctorToShare)
    setIsShareModalOpen(true)
  }

  const handleLogout = async () => {
    await AuthClientService.logout()
    router.push("/login")
  }

  const handleUserSettingsSave = (updatedUser: Patient | Doctor) => {
    if (updatedUser.role === "patient") {
      setIsUserSettingsOpen(false)
      toast({
        title: "Profile Updated",
        description: "Your patient profile has been successfully updated.",
      })
    } else {
      // Optional: Handle or ignore doctor case
      console.warn("Received doctor data, but this handler is for patients only.")
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="flex items-center justify-between bg-white p-4 shadow-sm rounded-lg mb-4">
        <h1 className="text-2xl font-bold">Welcome, {patient.name}</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>View Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUserSettingsOpen(true)}>Edit Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="doctors">Find Doctors</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p>No appointments found. Request one below!</p>
              ) : (
                <div className="space-y-4 mb-4">
                  {appointments.map((app) => (
                    <Card key={app.id} className="p-4">
                      <p className="font-semibold">Doctor: {app.doctorName}</p>
                      <p>
                        Date: {app.date as any} at {app.time}
                      </p>
                      <p>Reason: {app.reason}</p>
                      <p>
                        Status:{" "}
                        <span
                          className={`font-medium ${app.status === "pending" ? "text-yellow-600" : app.status === "confirmed" ? "text-green-600" : "text-red-600"}`}
                        >
                          {app.status}
                        </span>
                      </p>
                    </Card>
                  ))}
                </div>
              )}
              <AppointmentForm patientId={patient.id} onAppointmentCreated={handleAppointmentCreated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalRecords.length === 0 ? (
                <p>No medical records found.</p>
              ) : (
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <Card key={record.id} className="p-4">
                      <p className="font-semibold">Doctor: {record.doctorName || "N/A"}</p>
                      <p>Date: {new Date(record.createdAt).toLocaleDateString()}</p>
                      <p>Diagnosis: {record.diagnosis}</p>
                      <p>Treatment: {record.treatment}</p>
                      <p>Notes: {record.notes}</p>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 ? (
                <p>No doctors found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} onShare={handleShareDoctorProfile} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <MockChat currentUserRole="patient" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ShareAppointmentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        doctor={selectedDoctorToShare}
      />

      <PatientProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} patient={patient} />

      {isUserSettingsOpen && <UserSettingsForm user={patient} onSave={handleUserSettingsSave} />}
    </div>
  )
}
