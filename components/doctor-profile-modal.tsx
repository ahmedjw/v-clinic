"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, MapPin } from "lucide-react"
import type { Doctor } from "@/lib/db"

interface DoctorProfileModalProps {
  doctor: Doctor
  onClose: () => void
  isOpen?: boolean
}

export function DoctorProfileModal({ doctor, onClose, isOpen }: DoctorProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage
              src={doctor.avatar || `/placeholder.svg?height=96&width=96&text=${doctor?.name.charAt(0)}`}
              alt={doctor?.name}
            />
            <AvatarFallback className="text-4xl">{doctor?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-bold">{doctor?.name}</DialogTitle>
          <p className="text-md text-gray-600">{doctor?.specialty}</p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <p className="text-gray-700">{doctor?.email}</p>
          </div>
          {doctor?.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-gray-500" />
              <p className="text-gray-700">{doctor?.phone}</p>
            </div>
          )}
          {doctor?.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <p className="text-gray-700">{doctor?.address}</p>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">About Me</h4>
            <p className="text-gray-700">{doctor?.bio}</p>
          </div>
        </div>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
