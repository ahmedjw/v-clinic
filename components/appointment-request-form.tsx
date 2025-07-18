"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AuthClientService } from "@/lib/auth-client"
import type { Appointment, Doctor, Patient } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface AppointmentRequestFormProps {
  patientId?: string // Optional if doctor is creating for a specific patient
  doctorId?: string // Optional if patient is requesting for a specific doctor
  onSave: (appointment: Appointment) => void
  onCancel: () => void
  doctors: Doctor[] // Pass doctors from parent
  patients?: Patient[] // Pass patients from parent if doctor is creating
}

export function AppointmentRequestForm({
  patientId: initialPatientId,
  doctorId: initialDoctorId,
  onSave,
  onCancel,
  doctors,
  patients,
}: AppointmentRequestFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || "")
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || "")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id)
    }
    if (patients && patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id)
    }
  }, [doctors, patients, selectedDoctorId, selectedPatientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedPatientId || !selectedDoctorId || !date || !time || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const patient =
      patients?.find((p) => p.id === selectedPatientId) ||
      ((await AuthClientService.getUserById(selectedPatientId)) as Patient)
    const doctor =
      doctors.find((d) => d.id === selectedDoctorId) ||
      ((await AuthClientService.getUserById(selectedDoctorId)) as Doctor)

    if (!patient || !doctor) {
      toast({
        title: "Error",
        description: "Patient or Doctor not found.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const newAppointment: Omit<Appointment, "id"> = {
        patientId: patient.id,
        doctorId: doctor.id,
        patientName: patient.name,
        doctorName: doctor.name,
        patientEmail: patient.email,
        date,
        time,
        reason,
        status: "pending", // Initial status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      }

      const createdAppointment = await AuthClientService.addAppointment(newAppointment)
      onSave(createdAppointment)
      toast({
        title: "Appointment Created!",
        description: "The appointment has been successfully scheduled.",
      })
    } catch (error) {
      console.error("Failed to create appointment:", error)
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {patients && (
        <div className="space-y-2">
          <Label htmlFor="patient">Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger id="patient">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((pat) => (
                <SelectItem key={pat.id} value={pat.id}>
                  {pat.name} ({pat.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="doctor">Doctor</Label>
        <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
          <SelectTrigger id="doctor">
            <SelectValue placeholder="Select a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Appointment</Label>
        <Textarea
          id="reason"
          placeholder="Briefly describe the reason for the appointment..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Appointment"}
        </Button>
      </div>
    </form>
  )
}
