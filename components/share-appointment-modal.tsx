"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Share2, Check, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Appointment, Patient } from "@/lib/db"

interface ShareAppointmentModalProps {
  appointment: Appointment
  patient: Patient | undefined
  onClose: () => void
}

export function ShareAppointmentModal({ appointment, patient, onClose }: ShareAppointmentModalProps) {
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(patient?.phone || "")
  const [smsSent, setSmsSent] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (appointment && patient) {
      const baseUrl = window.location.origin // Gets the base URL of the deployed app
      const link = `${baseUrl}/share-appointment?appointmentId=${appointment.id}&patientId=${patient.id}`
      setShareLink(link)
    }
  }, [appointment, patient])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast({
      title: "Link Copied!",
      description: "The appointment share link has been copied to your clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareViaSMS = () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number to send SMS.",
        variant: "destructive",
      })
      return
    }

    const message = `Hi ${patient?.name || "there"}, your Virtual Clinic appointment details: ${shareLink}`
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`

    try {
      window.open(smsUrl, "_self") // Use _self to open in the same tab/window on mobile
      setSmsSent(true)
      toast({
        title: "SMS Initiated",
        description: "Your device's messaging app should open with the pre-filled SMS.",
      })
    } catch (error) {
      console.error("Failed to open SMS app:", error)
      toast({
        title: "Error",
        description: "Could not open messaging app. Please copy the link and send manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Appointment
          </DialogTitle>
          <DialogDescription>Share this appointment's details with the patient.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="shareLink">Shareable Link</Label>
            <div className="flex space-x-2">
              <Input id="shareLink" readOnly value={shareLink} className="flex-1" />
              <Button onClick={handleCopyLink} size="icon" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">{copied ? "Copied" : "Copy Link"}</span>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Send via SMS (Patient's Phone)</Label>
            <div className="flex space-x-2">
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button onClick={handleShareViaSMS} disabled={smsSent || !phoneNumber} size="icon" className="shrink-0">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Send SMS</span>
              </Button>
            </div>
            {smsSent && <p className="text-sm text-green-600">SMS initiated!</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
