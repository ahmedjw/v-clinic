"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/db"
import { Button } from "./ui/button"
import { MessageSquare, Stethoscope } from "lucide-react"
import { MockChat } from "./mock-chat"
import { useState } from "react"

interface DoctorProfileModalProps {
  doctor: User
  onClose: () => void
}

export function DoctorProfileModal({ doctor, onClose }: DoctorProfileModalProps) {
  const [showChatModal, setShowChatModal] = useState(false)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Dr. {doctor.name}'s Profile</DialogTitle>
          <DialogDescription>Details about the healthcare provider.</DialogDescription>
        </DialogHeader>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Email:</strong> {doctor.email}
            </p>
            <p>
              <strong>Specialization:</strong> {doctor.specialization || "General Practitioner"}
            </p>
            <p>
              <strong>License Number:</strong> {doctor.licenseNumber || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {doctor.phone || "N/A"}
            </p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowChatModal(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Doctor
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
      {showChatModal && <MockChat onClose={() => setShowChatModal(false)} />}
    </Dialog>
  )
}
