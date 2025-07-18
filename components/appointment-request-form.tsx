"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Appointment, Doctor, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { AuthClientService } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

interface AppointmentRequestFormProps {
  patientId: string
  onSave: (appointment: Appointment) => void
  onCancel: () => void
}

export function AppointmentRequestForm({ patientId, onSave, onCancel }: AppointmentRequestFormProps) {
  const [formData, setFormData] = useState<
    Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced" | "patientName">
  >({
    patientId: patientId,
    doctorId: "",
    date: "",
    time: "",
    type: "consultation",
    status: "pending", // Requests start as pending
    notes: "",
  })
  const [doctors, setDoctors] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const authService = new AuthClientService()

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const allDoctors = authService.getMockDoctors()
        setDoctors(allDoctors)
      } catch (err) {
        console.error("Failed to load doctors:", err)
        setError("Failed to load doctor information.")
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.doctorId || !formData.date || !formData.time || !formData.type) {
      setError("Please fill in all required fields.")
      return
    }

    try {
      const localDB = getLocalDB()
      const patient = await localDB.getPatientById(patientId)
      if (!patient) {
        setError("Patient not found.")
        return
      }

      const newAppointment: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced"> = {
        ...formData,
        patientName: patient.name, // Add patientName from fetched patient
      }

      const savedAppointment = await localDB.addAppointment(newAppointment)
      toast({
        title: "Appointment Request Sent",
        description: `Your request for ${patient.name} on ${formData.date} at ${formData.time} has been sent.`,
      })
      onSave(savedAppointment)
    } catch (err) {
      console.error("Failed to send appointment request:", err)
      setError("Failed to send appointment request. Please try again.")
      toast({
        title: "Error",
        description: "Failed to send appointment request.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Request New Appointment</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Request New Appointment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="doctorId">Doctor</Label>
            <Select value={formData.doctorId} onValueChange={(value) => handleChange("doctorId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({(d as Doctor).specialization})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Appointment Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="checkup">Check-up</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Reason for Appointment</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Briefly describe your reason for the appointment..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Send Request</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
