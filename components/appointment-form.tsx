"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AuthClientService } from "@/lib/auth-client"
import type { Appointment, Doctor } from "@/lib/db"

interface AppointmentFormProps {
  patientId: string
  onAppointmentCreated: (appointment: Appointment) => void
}

export function AppointmentForm({ patientId, onAppointmentCreated }: AppointmentFormProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDoctors = async () => {
      const fetchedDoctors = await AuthClientService.getMockDoctors()
      setDoctors(fetchedDoctors)
      if (fetchedDoctors.length > 0) {
        setSelectedDoctorId(fetchedDoctors[0].id)
      }
    }
    fetchDoctors()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedDoctorId || !date || !time || !reason) {

      setLoading(false)
      return
    }

    const selectedDoctor = doctors.find((doc) => doc.id === selectedDoctorId)
    if (!selectedDoctor) {

      setLoading(false)
      return
    }

    try {
      const currentUser = await AuthClientService.getCurrentUser()
      if (!currentUser || currentUser.role !== "patient") {

        setLoading(false)
        return
      }

      const newAppointment: Omit<Appointment, "id"> = {
        patientId: patientId,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        patientName: currentUser.name,
        patientEmail: currentUser.email,
        date,
        time,
        reason,
        status: "pending", // Initial status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      }

      const createdAppointment = await AuthClientService.addAppointment(newAppointment)
      onAppointmentCreated(createdAppointment)
      // Clear form
      setDate("")
      setTime("")
      setReason("")
      setSelectedDoctorId(doctors[0]?.id || "")
    } catch (error) {
      console.error("Failed to request appointment:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-xl font-semibold">Request New Appointment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="reason">Reason for Appointment</Label>
          <Textarea
            id="reason"
            placeholder="Briefly describe your reason for the appointment..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Request Appointment"}
      </Button>
    </form>
  )
}
