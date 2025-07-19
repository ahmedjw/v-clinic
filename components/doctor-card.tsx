"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Stethoscope, Mail, Phone } from "lucide-react"
import type { Doctor } from "@/lib/db"

interface DoctorCardProps {
  doctor: Doctor
  onShare?: (doctor: Doctor) => void
}

export function DoctorCard({ doctor, onShare }: DoctorCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{doctor?.name}</CardTitle>
        <CardDescription>{doctor?.specialty}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-sm text-gray-600">{doctor?.bio}</p>
        <div className="flex items-center text-sm text-gray-500">
          <Mail className="mr-2 h-4 w-4" /> {doctor?.email}
        </div>
        {doctor?.phone && (
          <div className="flex items-center text-sm text-gray-500">
            <Phone className="mr-2 h-4 w-4" /> {doctor?.phone}
          </div>
        )}
        {doctor?.address && (
          <div className="flex items-center text-sm text-gray-500">
            <Stethoscope className="mr-2 h-4 w-4" /> {doctor?.address}
          </div>
        )}
      </CardContent>
      {onShare && (
        <div className="p-4 border-t">
          <Button onClick={() => onShare(doctor)} className="w-full">
            <Share2 className="mr-2 h-4 w-4" /> Share Profile
          </Button>
        </div>
      )}
    </Card>
  )
}
