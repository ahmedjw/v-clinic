"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Appointment, Patient, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { AuthClientService } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

interface AppointmentFormProps {
  initialData?: Appointment
  patientId?: string // Optional, if creating an appointment for a specific patient
  onSave: (appointment: Appointment) => void
  onCancel: () => void
}

export function AppointmentForm({ initialData, patientId, onSave, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<Omit<Appointment, "id" | "createdAt" | "updatedAt" | "synced">>({
    patientId: initialData?.patientId || patientId || "",
    doctorId: initialData?.doctorId || "",
    patientName: initialData?.patientName || "",
    date: initialData?.date || "",
    time: initialData?.time || "",
    type: initialData?.type || "consultation",
    status: initialData?.status || "scheduled",
    notes: initialData?.notes || "",
  })
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const authService = new AuthClientService()

  useEffect(() => {
    const loadData = async () => {
      try {
        const localDB = getLocalDB()
        const allPatients = await localDB.getAllPatients()
        setPatients(allPatients)

        const allDoctors = authService.getMockDoctors()
        setDoctors(allDoctors)

        if (patientId && !initialData) {
          const selectedPatient = allPatients.find((p) => p.id === patientId)
          if (selectedPatient) {
            setFormData((prev) => ({ ...prev, patientName: selectedPatient.name }))
          }
        }
      } catch (err) {
        console.error("Failed to load patients or doctors:", err)
        setError("Failed to load necessary data for the form.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [patientId, initialData])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "patientId") {
      const selectedPatient = patients.find((p) => p.id === value)
      if (selectedPatient) {
        setFormData((prev) => ({ ...prev, patientName: selectedPatient.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time || !formData.type) {
      setError("Please fill in all required fields.")
      return
    }

    try {
      const localDB = getLocalDB()
      let savedAppointment: Appointment

      if (initialData) {
        savedAppointment = await localDB.updateAppointment({ ...initialData, ...formData })
        toast({
          title: "Appointment Updated",
          description: `Appointment for ${formData.patientName} on ${formData.date} at ${formData.time} has been updated.`,
        })
      } else {
        savedAppointment = await localDB.addAppointment(formData)
        toast({
          title: "Appointment Scheduled",
          description: `Appointment for ${formData.patientName} on ${formData.date} at ${formData.time} has been scheduled.`,
        })
      }
      onSave(savedAppointment)
    } catch (err) {
      console.error("Failed to save appointment:", err)
      setError("Failed to save appointment. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save appointment.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{initialData ? "Edit Appointment" : "Schedule New Appointment"}</CardTitle>
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
        <CardTitle>{initialData ? "Edit Appointment" : "Schedule New Appointment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => handleChange("patientId", value)}
                disabled={!!patientId || !!initialData} // Disable if patientId is provided or editing existing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor</Label>
              <Select value={formData.doctorId} onValueChange={(value) => handleChange("doctorId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any specific notes for the appointment..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update Appointment" : "Schedule Appointment"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
