"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Appointment, Patient, User } from "@/lib/db"

interface AppointmentRequestFormProps {
  patients: Patient[] // Should typically be just the current patient for a patient user
  doctors: User[] // List of available doctors
  onSubmit: (appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">) => Promise<void>
  onCancel: () => void
  currentUser: User // The currently logged-in user (patient)
}

export function AppointmentRequestForm({
  patients,
  doctors,
  onSubmit,
  onCancel,
  currentUser,
}: AppointmentRequestFormProps) {
  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || "", // Auto-select current patient
    patientName: patients[0]?.name || "", // Auto-fill current patient's name
    doctorId: "", // Patient selects doctor
    date: "",
    time: "",
    type: "consultation" as Appointment["type"],
    status: "requested" as Appointment["status"], // Default status for patient requests
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      setFormData({
        patientId: patients[0]?.id || "",
        patientName: patients[0]?.name || "",
        doctorId: "",
        date: "",
        time: "",
        type: "consultation",
        status: "requested",
        notes: "",
      })
    } catch (error) {
      console.error("Failed to request appointment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorChange = (doctorId: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorId,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Request New Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Input id="patient" value={formData.patientName} disabled className="bg-gray-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select value={formData.doctorId} onValueChange={handleDoctorChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} ({doctor.specialization || "General Practitioner"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Appointment["type"]) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Reason for appointment..."
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Requesting..." : "Request Appointment"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
