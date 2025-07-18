"use client"

import { useEffect, useState } from "react"
import { AuthClientService } from "@/lib/auth-client"
import type { Appointment, Doctor, MedicalRecord, Patient } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Settings, LogOut, Share2 } from "lucide-react"
import { AppointmentRequestForm } from "@/components/appointment-request-form"
import { MedicalRecordForm } from "@/components/medical-record-form"
import { ShareAppointmentModal } from "@/components/share-appointment-modal"
import { useToast } from "@/components/ui/use-toast"
import { DoctorProfileModal } from "./doctor-profile-modal"
import { MockChat } from "./mock-chat"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { UserSettingsForm } from "./user-settings-form"

interface DoctorDashboardProps {
  doctor: Doctor
}

export function DoctorDashboard({ doctor }: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState("appointments")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false)
  const [isMedicalRecordFormOpen, setIsMedicalRecordFormOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchDoctorData = async () => {
      const fetchedAppointments = await AuthClientService.getAppointmentsForDoctor(doctor.id)
      setAppointments(fetchedAppointments)
      const fetchedRecords = await AuthClientService.getMedicalRecordsForDoctor(doctor.id)
      setMedicalRecords(fetchedRecords)
      const fetchedPatients = await AuthClientService.getMockPatients()
      setPatients(fetchedPatients)
    }
    fetchDoctorData()

    const handleAppointmentUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Appointment>
      if (customEvent.detail.doctorId === doctor.id) {
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
      if (customEvent.detail.doctorId === doctor.id) {
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
  }, [doctor.id])

  const handleAppointmentSave = async (appointment: Appointment) => {
    setIsAppointmentFormOpen(false)
    const updatedAppointments = await AuthClientService.getAppointmentsForDoctor(doctor.id)
    setAppointments(updatedAppointments)
  }

  const handleMedicalRecordSave = async (record: MedicalRecord) => {
    setIsMedicalRecordFormOpen(false)
    const updatedRecords = await AuthClientService.getMedicalRecordsForDoctor(doctor.id)
    setMedicalRecords(updatedRecords)
  }

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: Appointment["status"]) => {
    try {
      const updatedAppointment = await AuthClientService.updateAppointmentStatus(appointmentId, status)
      setAppointments((prev) => prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app)))
      toast({
        title: "Appointment Updated",
        description: `Appointment status changed to ${status}.`,
      })
    } catch (error) {
      console.error("Failed to update appointment status:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    await AuthClientService.logout()
    router.push("/login")
  }

  const handleUserSettingsSave = (updatedUser: Doctor) => {
    // Update the local doctor state if needed, or rely on re-fetch if complex
    // For simplicity, we'll just close the modal and assume the data is updated in AuthClientService
    setIsUserSettingsOpen(false)
    toast({
      title: "Profile Updated",
      description: "Your doctor profile has been successfully updated.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="flex items-center justify-between bg-white p-4 shadow-sm rounded-lg mb-4">
        <h1 className="text-2xl font-bold">Welcome, Dr. {doctor.name}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" /> Share Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
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
          <TabsTrigger value="patients">My Patients</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Upcoming Appointments</CardTitle>
              <Button onClick={() => setIsAppointmentFormOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Appointment
              </Button>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p>No appointments scheduled.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.patientName}</TableCell>
                        <TableCell>{app.date}</TableCell>
                        <TableCell>{app.time}</TableCell>
                        <TableCell>{app.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              app.status === "pending"
                                ? "secondary"
                                : app.status === "confirmed"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {app.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateAppointmentStatus(app.id, "confirmed")}
                            >
                              Confirm
                            </Button>
                          )}
                          {app.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateAppointmentStatus(app.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                          {(app.status === "pending" || app.status === "confirmed") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleUpdateAppointmentStatus(app.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Patient Medical Records</CardTitle>
              <Button onClick={() => setIsMedicalRecordFormOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Record
              </Button>
            </CardHeader>
            <CardContent>
              {medicalRecords.length === 0 ? (
                <p>No medical records found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicalRecords.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{rec.patientName}</TableCell>
                        <TableCell>{new Date(rec.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{rec.diagnosis}</TableCell>
                        <TableCell>{rec.treatment}</TableCell>
                        <TableCell>{rec.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p>No patients registered yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((pat) => (
                      <TableRow key={pat.id}>
                        <TableCell className="font-medium">{pat.name}</TableCell>
                        <TableCell>{pat.email}</TableCell>
                        <TableCell>{pat.phone}</TableCell>
                        <TableCell>{pat.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <MockChat currentUserRole="doctor" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAppointmentFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Add New Appointment</h2>
            <AppointmentRequestForm
              doctorId={doctor.id}
              onSave={handleAppointmentSave}
              onCancel={() => setIsAppointmentFormOpen(false)}
              doctors={[doctor]} // Doctor is creating, so only their own profile is relevant
              patients={patients} // Pass all patients for selection
            />
          </div>
        </div>
      )}

      {isMedicalRecordFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Add New Medical Record</h2>
            <MedicalRecordForm
              doctorId={doctor.id}
              onSave={handleMedicalRecordSave}
              onCancel={() => setIsMedicalRecordFormOpen(false)}
              patients={patients} // Pass all patients for selection
            />
          </div>
        </div>
      )}

      <ShareAppointmentModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} doctor={doctor} />

      <DoctorProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} doctor={doctor} />

      {isUserSettingsOpen && <UserSettingsForm user={doctor} onSave={handleUserSettingsSave} />}
    </div>
  )
}
