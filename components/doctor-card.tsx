"use client"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Stethoscope } from "lucide-react"
import type { User } from "@/lib/db"

interface DoctorCardProps {
  doctor: User
  onMessage: (doctor: User) => void
}

export function DoctorCard({ doctor, onMessage }: DoctorCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Dr. {doctor.name}</CardTitle>
            <p className="text-sm text-gray-600">{doctor.specialization || "General Practitioner"}</p>
            <p className="text-sm text-gray-500">{doctor.email}</p>
          </div>
        </div>
        <Button onClick={() => onMessage(doctor)} variant="outline" className="w-full sm:w-auto">
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </Button>
      </CardContent>
    </Card>
  )
}
