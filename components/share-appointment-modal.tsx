"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import type { Doctor } from "@/lib/db"

interface ShareAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  doctor: Doctor | null
}

export function ShareAppointmentModal({ isOpen, onClose, doctor }: ShareAppointmentModalProps) {
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && doctor) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/share-appointment?doctorId=${doctor.id}`
      setShareLink(link)
      setCopied(false) // Reset copied state when modal opens
    }
  }, [isOpen, doctor])

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset icon after 2 seconds
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Doctor Profile</DialogTitle>
          <DialogDescription>
            Share this link with patients to allow them to view Dr. {doctor?.name}'s profile and request an appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input value={shareLink} readOnly className="flex-grow" />
          <Button onClick={handleCopy} size="icon" className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Note: This link allows anyone to view the profile.</p>
      </DialogContent>
    </Dialog>
  )
}
