"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { Patient, User } from "@/lib/db" // Import User type

interface MedicalRecordFormProps {
  patient: Patient
  onSubmit: (record: any) => Promise<void>
  onCancel: () => void
  currentUser: User // Pass current user to assign doctor
}

export function MedicalRecordForm({ patient, onSubmit, onCancel, currentUser }: MedicalRecordFormProps) {
  const [formData, setFormData] = useState({
    patientId: patient.id,
    doctorId: currentUser.id, // Auto-assign current doctor
    date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    symptoms: [] as string[],
    treatment: "",
    prescription: [] as Array<{
      medication: string
      dosage: string
      frequency: string
      duration: string
    }>,
    vitals: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
    },
    notes: "",
    followUpDate: "",
  })

  const [currentSymptom, setCurrentSymptom] = useState("")
  const [currentMedication, setCurrentMedication] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up vitals - remove empty values
      const cleanVitals = Object.fromEntries(Object.entries(formData.vitals).filter(([_, value]) => value !== ""))

      await onSubmit({
        ...formData,
        vitals: cleanVitals,
        followUpDate: formData.followUpDate || undefined,
      })
    } catch (error) {
      console.error("Failed to add medical record:", error)
    } finally {
      setLoading(false)
    }
  }

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, currentSymptom.trim()],
      }))
      setCurrentSymptom("")
    }
  }

  const removeSymptom = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }))
  }

  const addMedication = () => {
    if (currentMedication.medication.trim()) {
      setFormData((prev) => ({
        ...prev,
        prescription: [...prev.prescription, { ...currentMedication }],
      }))
      setCurrentMedication({
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
      })
    }
  }

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add Medical Record - {patient.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Primary diagnosis"
                required
              />
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <div className="flex gap-2">
                <Input
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  placeholder="Add symptom"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSymptom())}
                />
                <Button type="button" onClick={addSymptom} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {symptom}
                    <button type="button" onClick={() => removeSymptom(index)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Textarea
                id="treatment"
                value={formData.treatment}
                onChange={(e) => setFormData((prev) => ({ ...prev, treatment: e.target.value }))}
                placeholder="Treatment plan and procedures"
                rows={3}
                required
              />
            </div>

            {/* Vitals */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Vitals</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Blood Pressure</Label>
                  <Input
                    id="bloodPressure"
                    value={formData.vitals.bloodPressure}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vitals: { ...prev.vitals, bloodPressure: e.target.value },
                      }))
                    }
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="heartRate"
                    type="number"
                    value={formData.vitals.heartRate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vitals: { ...prev.vitals, heartRate: e.target.value },
                      }))
                    }
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.vitals.temperature}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vitals: { ...prev.vitals, temperature: e.target.value },
                      }))
                    }
                    placeholder="36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.vitals.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vitals: { ...prev.vitals, weight: e.target.value },
                      }))
                    }
                    placeholder="70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.vitals.height}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vitals: { ...prev.vitals, height: e.target.value },
                      }))
                    }
                    placeholder="175"
                  />
                </div>
              </div>
            </div>

            {/* Prescriptions */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Prescriptions</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                <Input
                  value={currentMedication.medication}
                  onChange={(e) => setCurrentMedication((prev) => ({ ...prev, medication: e.target.value }))}
                  placeholder="Medication name"
                />
                <Input
                  value={currentMedication.dosage}
                  onChange={(e) => setCurrentMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Dosage (e.g., 500mg)"
                />
                <Input
                  value={currentMedication.frequency}
                  onChange={(e) => setCurrentMedication((prev) => ({ ...prev, frequency: e.target.value }))}
                  placeholder="Frequency (e.g., twice daily)"
                />
                <div className="flex gap-2">
                  <Input
                    value={currentMedication.duration}
                    onChange={(e) => setCurrentMedication((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="Duration (e.g., 7 days)"
                  />
                  <Button type="button" onClick={addMedication} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.prescription.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{med.medication}</span> - {med.dosage}, {med.frequency} for{" "}
                      {med.duration}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeMedication(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional observations, recommendations, or notes"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Medical Record"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
