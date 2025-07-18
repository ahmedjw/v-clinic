"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Patient, Appointment, MedicalRecord, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { useEffect, useState } from "react"
import { Calendar, FileText, Heart, Stethoscope, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "./ui/button"
import { AuthClientService } from "@/lib/auth-client" // To get doctor names

interface PatientProfileModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
}

export function PatientProfileModal({ isOpen, onClose, patient }: PatientProfileModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [assignedDoctors, setAssignedDoctors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const authService = new AuthClientService() // Create an instance

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const localDB = getLocalDB()
        const patientAppointments = await localDB.getAppointments(patient.id)
        const patientRecords = await localDB.getMedicalRecords(patient.id)
        setAppointments(patientAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        setMedicalRecords(patientRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

        let allUsers: User[] = []
        allUsers = authService.getMockDoctors() // Call on the instance
        const allDoctors = allUsers.filter((user: User) => user.role === "doctor")
        const assigned = allDoctors.filter((doc: User) => patient.assignedDoctorIds.includes(doc.id))
        setAssignedDoctors(assigned)
      } catch (error) {
        console.error("Failed to load patient specific data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPatientData()
  }, [patient.id, patient.assignedDoctorIds])

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage
              src={patient.avatar || `/placeholder.svg?height=96&width=96&text=${patient.name.charAt(0)}`}
              alt={patient.name}
            />
            <AvatarFallback className="text-4xl">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-bold">{patient.name}</DialogTitle>
          <p className="text-md text-gray-600">Patient Profile</p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <p className="text-gray-700">{patient.email}</p>
          </div>
          {patient.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-gray-500" />
              <p className="text-gray-700">{patient.phone}</p>
            </div>
          )}
          {patient.dateOfBirth && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <p className="text-gray-700">DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <p className="text-gray-700">{patient.address}</p>
            </div>
          )}
          {patient.medicalHistory && (
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Medical History</h4>
              <p className="text-gray-700">{patient.medicalHistory}</p>
            </div>
          )}
          {/* Patient Details Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Personal & Health Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Blood Type:</strong> {patient.bloodType || "N/A"}
              </p>
              <p>
                <strong>Height:</strong> {patient.height ? `${patient.height} cm` : "N/A"}
              </p>
              <p>
                <strong>Weight:</strong> {patient.weight ? `${patient.weight} kg` : "N/A"}
              </p>
              <div>
                <strong>Allergies:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
              <div>
                <strong>Current Medications:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.currentMedications.length > 0 ? (
                    patient.currentMedications.map((med, idx) => (
                      <Badge key={idx} variant="secondary">
                        {med}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
              <div>
                <strong>Emergency Contact:</strong>
                <p className="ml-2">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) -{" "}
                  {patient.emergencyContact.phone}
                </p>
              </div>
              <div>
                <strong>Assigned Doctors:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignedDoctors.length > 0 ? (
                    assignedDoctors.map((doc) => (
                      <Badge key={doc.id} variant="outline" className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> {doc.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Appointments & Medical Records */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <div key={apt.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </p>
                        <Badge variant={apt.status === "scheduled" ? "default" : "secondary"}>{apt.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {apt.type} - {apt.notes}
                      </p>
                      <p className="text-xs text-gray-500">
                        Doctor: {assignedDoctors.find((d) => d.id === apt.doctorId)?.name || "Unknown"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No appointments for this patient.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicalRecords.length > 0 ? (
                  medicalRecords.map((record) => (
                    <div key={record.id} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{record.diagnosis}</p>
                        <span className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{record.treatment}</p>
                      {record.notes && <p className="text-xs text-gray-700">Notes: {record.notes}</p>}
                      <p className="text-xs text-gray-500">
                        Doctor: {assignedDoctors.find((d) => d.id === record.doctorId)?.name || "Unknown"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No medical records for this patient.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
