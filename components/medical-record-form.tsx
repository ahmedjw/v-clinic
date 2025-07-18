"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AuthClientService } from "@/lib/auth-client"
import type { MedicalRecord, Patient } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface MedicalRecordFormProps {
  doctorId: string
  onSave: (record: MedicalRecord) => void
  onCancel: () => void
  patients: Patient[] // Pass patients from parent
}

export function MedicalRecordForm({ doctorId, onSave, onCancel, patients }: MedicalRecordFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [treatment, setTreatment] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id)
    }
  }, [patients, selectedPatientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedPatientId || !diagnosis || !treatment) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Patient, Diagnosis, Treatment).",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const patient = patients.find((p) => p.id === selectedPatientId)
    if (!patient) {
      toast({
        title: "Error",
        description: "Selected patient not found.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const newRecord: Omit<MedicalRecord, "id"> = {
        patientId: patient.id,
        doctorId: doctorId,
        patientName: patient.name,
        diagnosis,
        treatment,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      }

      const createdRecord = await AuthClientService.addMedicalRecord(newRecord)
      onSave(createdRecord)
      toast({
        title: "Medical Record Added!",
        description: "The medical record has been successfully saved.",
      })
    } catch (error) {
      console.error("Failed to add medical record:", error)
      toast({
        title: "Error",
        description: "Failed to add medical record. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="patient">Patient</Label>
        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
          <SelectTrigger id="patient">
            <SelectValue placeholder="Select a patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((pat) => (
              <SelectItem key={pat.id} value={pat.id}>
                {pat.name} ({pat.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Input
          id="diagnosis"
          placeholder="e.g., Acute Bronchitis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Treatment</Label>
        <Textarea
          id="treatment"
          placeholder="e.g., Prescribed Amoxicillin 500mg, advised rest and fluids."
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional observations or instructions."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Record"}
        </Button>
      </div>
    </form>
  )
}
