"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getLocalDB, type Appointment, type Patient } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User } from "lucide-react"
import { AuthClientService } from "@/lib/auth-client"

export default function ShareAppointmentPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")
  const patientId = searchParams.get("patientId")

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authService = new AuthClientService()

  useEffect(() => {
    const loadAppointmentData = async () => {
      if (!appointmentId || !patientId) {
        setError("Invalid appointment link.")
        setLoading(false)
        return
      }

      try {
        const localDB = getLocalDB()
        const foundAppointment = await localDB.getAppointmentById(appointmentId)
        const foundPatient = await localDB.getPatientById(patientId)

        if (foundAppointment && foundPatient && foundAppointment.patientId === foundPatient.id) {
          setAppointment(foundAppointment)
          setPatient(foundPatient)
        } else {
          setError("Appointment or patient not found, or data mismatch.")
        }
      } catch (err) {
        console.error("Failed to load shared appointment:", err)
        setError("Failed to load appointment data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadAppointmentData()
  }, [appointmentId, patientId])

  const handleAddToCalendar = () => {
    if (!appointment || !patient) return

    const eventTitle = `Virtual Clinic Appointment with Dr. ${authService.getMockDoctors().find((d) => d.id === appointment.doctorId)?.name || "Unknown"}`
    const eventDescription = `Type: ${appointment.type}\nNotes: ${appointment.notes}\nPatient: ${patient.name}`
    const eventLocation = "Virtual Clinic"

    const startDate = new Date(`${appointment.date}T${appointment.time}:00`)
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000) // Assuming 30 min appointments

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, "")
    }

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDateTime(startDate)}/${formatDateTime(endDate)}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`

    window.open(googleCalendarUrl, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => (window.location.href = "/")} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Appointment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The appointment details could not be loaded.</p>
            <Button onClick={() => (window.location.href = "/")} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const doctor = authService.getMockDoctors().find((d) => d.id === appointment.doctorId)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-700">Appointment Details</CardTitle>
          <p className="text-gray-600 mt-2">Your upcoming virtual clinic appointment</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">Date:</p>
              <p className="text-gray-800">
                {new Date(appointment.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">Time:</p>
              <p className="text-gray-800">{appointment.time}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">Patient:</p>
              <p className="text-gray-800">{patient.name}</p>
            </div>
          </div>
          {doctor && (
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-lg font-semibold">Doctor:</p>
                <p className="text-gray-800">
                  {doctor.name} ({doctor.specialization})
                </p>
              </div>
            </div>
          )}
          <div className="border-t pt-4 mt-4">
            <p className="text-lg font-semibold">Appointment Type:</p>
            <p className="text-gray-800">{appointment.type}</p>
          </div>
          {appointment.notes && (
            <div>
              <p className="text-lg font-semibold">Notes:</p>
              <p className="text-gray-800">{appointment.notes}</p>
            </div>
          )}
          <Button onClick={handleAddToCalendar} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
            Add to Calendar
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full mt-2">
            Go to Virtual Clinic
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
