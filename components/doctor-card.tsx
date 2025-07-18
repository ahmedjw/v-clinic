"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Stethoscope, Mail, Phone } from "lucide-react"
import type { User } from "@/lib/db"

interface DoctorCardProps {
  doctor: User
  onViewProfile: (doctor: User) => void
}

export function DoctorCard({ doctor, onViewProfile }: DoctorCardProps) {
  return (
    <Card className="flex flex-col items-center text-center p-4 shadow-sm hover:shadow-md transition-shadow">
      <Avatar className="h-24 w-24 mb-4">
        <AvatarImage src={`/placeholder.svg?height=96&width=96&text=${doctor.name.charAt(0)}`} alt={doctor.name} />
        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-xl font-semibold">{doctor.name}</CardTitle>
        <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
          <Stethoscope className="h-4 w-4" /> {doctor.specialization || "General Practitioner"}
        </p>
      </CardHeader>
      <CardContent className="p-0 text-sm text-gray-500 space-y-1">
        <p className="flex items-center justify-center gap-1">
          <Mail className="h-3 w-3" /> {doctor.email}
        </p>
        <p className="flex items-center justify-center gap-1">
          <Phone className="h-3 w-3" /> {doctor.phone}
        </p>
      </CardContent>
      <Button onClick={() => onViewProfile(doctor)} className="mt-4 w-full">
        View Profile
      </Button>
    </Card>
  )
}
