"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { User, Appointment } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { useEffect, useState } from "react"
import { Calendar, Stethoscope, GraduationCap } from "lucide-react"
import { Button } from "./ui/button"

interface DoctorProfileModalProps {
  doctor: User
  onClose: () => void
}

export function DoctorProfileModal({ doctor, onClose }: DoctorProfileModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        const localDB = getLocalDB()
        const doctorAppointments = await localDB.getAllAppointments()
        setAppointments(
          doctorAppointments
            .filter((apt) => apt.doctorId === doctor.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        )
      } catch (error) {
        console.error("Failed to load doctor specific data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDoctorData()
  }, [doctor.id])

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{doctor.name}'s Profile</DialogTitle>
          <DialogDescription>Detailed view of doctor information and their scheduled appointments.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Doctor Details Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                Doctor Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Specialization:</strong> {doctor.specialization || "N/A"}
              </p>
              <p>
                <strong>License No.:</strong> {doctor.licenseNumber || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {doctor.email}
              </p>
              <p>
                <strong>Phone:</strong> {doctor.phone}
              </p>
              {doctor.education && (
                <div>
                  <strong>Education:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {doctor.education.map((edu, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> {edu}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {doctor.experience && (
                <div>
                  <strong>Experience:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {doctor.experience.map((exp, idx) => (
                      <li key={idx}>{exp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduled Appointments
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
                      <p className="text-xs text-gray-500">Patient: {apt.patientName}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No appointments scheduled for this doctor.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
