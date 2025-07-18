"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { MedicalRecord, Patient } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

interface MedicalRecordFormProps {
  initialData?: MedicalRecord
  patientId?: string // Optional, if creating a record for a specific patient
  doctorId: string // Doctor creating/editing the record
  onSave: (record: MedicalRecord) => void
  onCancel: () => void
}

export function MedicalRecordForm({ initialData, patientId, doctorId, onSave, onCancel }: MedicalRecordFormProps) {
  const [formData, setFormData] = useState<Omit<MedicalRecord, "id" | "createdAt" | "updatedAt" | "synced">>({
    patientId: initialData?.patientId || patientId || "",
    doctorId: initialData?.doctorId || doctorId,
    patientName: initialData?.patientName || "",
    date: initialData?.date || new Date().toISOString().split("T")[0], // Default to today
    diagnosis: initialData?.diagnosis || "",
    treatment: initialData?.treatment || "",
    notes: initialData?.notes || "",
  })
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const localDB = getLocalDB()
        const allPatients = await localDB.getAllPatients()
        setPatients(allPatients)

        if (patientId && !initialData) {
          const selectedPatient = allPatients.find((p) => p.id === patientId)
          if (selectedPatient) {
            setFormData((prev) => ({ ...prev, patientName: selectedPatient.name }))
          }
        }
      } catch (err) {
        console.error("Failed to load patients:", err)
        setError("Failed to load patient data for the form.")
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [patientId, initialData])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "patientId") {
      const selectedPatient = patients.find((p) => p.id === value)
      if (selectedPatient) {
        setFormData((prev) => ({ ...prev, patientName: selectedPatient.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.patientId || !formData.date || !formData.diagnosis || !formData.treatment) {
      setError("Please fill in all required fields: Patient, Date, Diagnosis, and Treatment.")
      return
    }

    try {
      const localDB = getLocalDB()
      let savedRecord: MedicalRecord

      if (initialData) {
        savedRecord = await localDB.updateMedicalRecord({ ...initialData, ...formData })
        toast({
          title: "Medical Record Updated",
          description: `Record for ${formData.patientName} on ${formData.date} has been updated.`,
        })
      } else {
        savedRecord = await localDB.addMedicalRecord(formData)
        toast({
          title: "Medical Record Added",
          description: `New record for ${formData.patientName} on ${formData.date} has been added.`,
        })
      }
      onSave(savedRecord)
    } catch (err) {
      console.error("Failed to save medical record:", err)
      setError("Failed to save medical record. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save medical record.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{initialData ? "Edit Medical Record" : "Add New Medical Record"}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Medical Record" : "Add New Medical Record"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => handleChange("patientId", value)}
                disabled={!!patientId || !!initialData} // Disable if patientId is provided or editing existing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              placeholder="Enter diagnosis..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment">Treatment</Label>
            <Textarea
              id="treatment"
              value={formData.treatment}
              onChange={(e) => handleChange("treatment", e.target.value)}
              placeholder="Enter treatment details..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update Record" : "Add Record"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
