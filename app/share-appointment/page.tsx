"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthClientService } from "@/lib/auth-client"
import type { Appointment, Doctor } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User2, Stethoscope, Info } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function ShareAppointmentPage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")
  const doctorId = searchParams.get("doctorId") // For sharing doctor profile directly
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (appointmentId) {
          const fetchedAppointment = await AuthClientService.getAppointmentById(appointmentId)
          if (fetchedAppointment) {
            setAppointment(fetchedAppointment)
            const fetchedDoctor = await AuthClientService.getDoctorById(fetchedAppointment.doctorId)
            setDoctor(fetchedDoctor || null)
          } else {
            setError("Appointment not found.")
          }
        } else if (doctorId) {
          const fetchedDoctor = await AuthClientService.getDoctorById(doctorId)
          if (fetchedDoctor) {
            setDoctor(fetchedDoctor)
          } else {
            setError("Doctor not found.")
          }
        } else {
          setError("No appointment or doctor ID provided.")
        }
      } catch (err) {
        console.error("Failed to fetch shared data:", err)
        setError("Failed to load details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [appointmentId, doctorId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
        <p className="ml-2">Loading shared details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <Info className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">Appointment Details</CardTitle>
            <p className="text-gray-500">Shared by your clinic</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <User2 className="h-5 w-5 text-gray-600" />
              <p className="text-lg">
                <span className="font-semibold">Patient:</span> {appointment.patientName}
              </p>
            </div>
            {doctor && (
              <div className="flex items-center space-x-3">
                <Stethoscope className="h-5 w-5 text-gray-600" />
                <p className="text-lg">
                  <span className="font-semibold">Doctor:</span> {doctor.name} ({doctor.specialty})
                </p>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-600" />
              <p className="text-lg">
                <span className="font-semibold">Date:</span> {new Date(appointment.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <p className="text-lg">
                <span className="font-semibold">Time:</span> {appointment.time}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Reason:</p>
              <p className="text-gray-700">{appointment.reason}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Status:</p>
              <p
                className={`font-bold ${appointment.status === "confirmed" ? "text-green-600" : appointment.status === "pending" ? "text-yellow-600" : "text-red-600"}`}
              >
                {appointment.status.toUpperCase()}
              </p>
            </div>
            <Button className="w-full mt-6" onClick={() => (window.location.href = "/login")}>
              Go to Clinic Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">Doctor Profile</CardTitle>
            <p className="text-gray-500">Shared by Virtual Clinic</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <User2 className="h-5 w-5 text-gray-600" />
              <p className="text-lg">
                <span className="font-semibold">Name:</span> {doctor.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-5 w-5 text-gray-600" />
              <p className="text-lg">
                <span className="font-semibold">Specialty:</span> {doctor.specialty}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Bio:</p>
              <p className="text-gray-700">{doctor.bio}</p>
            </div>
            <Button className="w-full mt-6" onClick={() => (window.location.href = "/login")}>
              Request Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <Info className="h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700">Nothing to Share</h2>
      <p className="text-gray-600">No valid appointment or doctor ID found in the URL.</p>
      <Button onClick={() => (window.location.href = "/login")} className="mt-4">
        Go to Clinic Login
      </Button>
    </div>
  )
}
