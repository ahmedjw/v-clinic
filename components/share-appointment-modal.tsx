"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Share2 } from "lucide-react"
import type { Appointment } from "@/lib/db"

interface ShareAppointmentModalProps {
  appointment: Appointment
  onClose: () => void
  senderRole: "doctor" | "patient"
  recipientPhoneNumber: string | null // NEW: Recipient's phone number
}

export function ShareAppointmentModal({
  appointment,
  onClose,
  senderRole,
  recipientPhoneNumber,
}: ShareAppointmentModalProps) {
  const [copied, setCopied] = useState(false)

  const shareLink = `${window.location.origin}/share-appointment?id=${appointment.id}&date=${appointment.date}&time=${appointment.time}&type=${appointment.type}&patient=${encodeURIComponent(appointment.patientName)}&doctor=${encodeURIComponent(appointment.doctorId)}&status=${appointment.status}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSimulateSMS = () => {
    const recipientName = senderRole === "doctor" ? appointment.patientName : "Doctor"
    const message = `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} (${appointment.type}) is ${appointment.status}. View details: ${shareLink}`

    alert(
      `Simulating SMS share:\n\nTo: ${recipientName} ${recipientPhoneNumber ? `(${recipientPhoneNumber})` : ""}\nMessage: ${message}\n\n(This is a mock. In a real app, this would open your phone's messaging app.)`,
    )
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Appointment
          </DialogTitle>
          <DialogDescription>
            Share this appointment's details with the {senderRole === "doctor" ? "patient" : "doctor"}.
            <br />
            <span className="text-red-500">
              (Note: This is a mock feature for demonstration. Real SMS integration requires a backend service.)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {recipientPhoneNumber && (
            <div className="space-y-2">
              <label htmlFor="recipient-phone" className="text-sm font-medium">
                Recipient Phone Number
              </label>
              <Input id="recipient-phone" value={recipientPhoneNumber} readOnly className="bg-gray-100" />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="share-link" className="text-sm font-medium">
              Shareable Link
            </label>
            <div className="flex items-center space-x-2">
              <Input id="share-link" value={shareLink} readOnly className="flex-1" />
              <Button onClick={handleCopy} size="sm">
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <Button onClick={handleSimulateSMS} className="w-full">
            Simulate SMS Share
          </Button>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
