"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getLocalDB, type Appointment } from "@/lib/db"
import { CheckCircle, XCircle, Info } from "lucide-react"

export default function ShareAppointmentPage() {
  const searchParams = useSearchParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const id = searchParams.get("id")
        const date = searchParams.get("date")
        const time = searchParams.get("time")
        const type = searchParams.get("type") as Appointment["type"]
        const patientName = searchParams.get("patient")
        const doctorId = searchParams.get("doctor")
        const status = searchParams.get("status") as Appointment["status"]

        if (!id || !date || !time || !type || !patientName || !doctorId || !status) {
          setError("Missing appointment details in the link.")
          return
        }

        // In a real app, you'd fetch the appointment from a backend using the ID.
        // For this mock, we reconstruct it from URL params.
        const mockAppointment: Appointment = {
          id,
          date,
          time,
          type,
          patientName,
          doctorId,
          status,
          patientId: "mock-patient-id", // Placeholder, as patientId isn't in URL for simplicity
          notes: "Details from shared link.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: true,
        }
        setAppointment(mockAppointment)
      } catch (err) {
        console.error("Error parsing appointment details:", err)
        setError("Failed to load appointment details.")
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentDetails()
  }, [searchParams])

  const handleUpdateStatus = async (newStatus: Appointment["status"]) => {
    if (!appointment) return

    setLoading(true)
    try {
      const localDB = getLocalDB()
      await localDB.init()
      await localDB.updateAppointmentStatus(appointment.id, newStatus)
      setAppointment((prev) => (prev ? { ...prev, status: newStatus } : null))
      alert(`Appointment status updated to ${newStatus}!`)
    } catch (err) {
      console.error("Failed to update appointment status:", err)
      setError("Failed to update appointment status locally.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Error Loading Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => (window.location.href = "/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Appointment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The appointment details could not be loaded.</p>
            <Button onClick={() => (window.location.href = "/login")} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Appointment Details</CardTitle>
          <p className="text-sm text-gray-500">Received via shared link</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p>
              <strong>Patient:</strong> {appointment.patientName}
            </p>
            <p>
              <strong>Doctor ID:</strong> {appointment.doctorId}
            </p>
            <p>
              <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {appointment.time}
            </p>
            <p>
              <strong>Type:</strong> <Badge variant="outline">{appointment.type}</Badge>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge
                variant={
                  appointment.status === "scheduled"
                    ? "default"
                    : appointment.status === "requested"
                      ? "secondary"
                      : "outline"
                }
              >
                {appointment.status}
              </Badge>
            </p>
            <p>
              <strong>Notes:</strong> {appointment.notes}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleUpdateStatus("scheduled")}
              disabled={appointment.status === "scheduled" || loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Mark as Scheduled
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus("cancelled")}
              disabled={appointment.status === "cancelled" || loading}
            >
              <XCircle className="h-4 w-4 mr-2" /> Mark as Cancelled
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")} className="mt-2">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
