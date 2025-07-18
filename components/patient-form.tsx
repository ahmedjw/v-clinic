"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Patient, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { AuthClientService } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

interface PatientFormProps {
  initialData?: Patient
  onSave: (patient: Patient) => void
  onCancel: () => void
}

export function PatientForm({ initialData, onSave, onCancel }: PatientFormProps) {
  const authService = new AuthClientService()
  const [formData, setFormData] = useState<Omit<Patient, "createdAt" | "updatedAt" | "synced">>({
    id: initialData?.id || "",
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    dateOfBirth: initialData?.dateOfBirth || "",
    gender: initialData?.gender || "male",
    address: initialData?.address || "",
    emergencyContact: initialData?.emergencyContact || { name: "", phone: "", relationship: "" },
    medicalHistory: initialData?.medicalHistory || "",
    allergies: initialData?.allergies || [],
    currentMedications: initialData?.currentMedications || [],
    bloodType: initialData?.bloodType || "",
    height: initialData?.height || 0,
    weight: initialData?.weight || 0,
    assignedDoctorIds: initialData?.assignedDoctorIds || [],
    role: "patient", // Ensure role is always patient for this form
  })
  const [error, setError] = useState<string | null>(null)
  const [allDoctors, setAllDoctors] = useState<User[]>([])
  const { toast } = useToast()

  // Load all doctors for assignment
  useState(() => {
    setAllDoctors(authService.getMockDoctors())
  })

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }))
  }

  const handleAllergiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      allergies: e.target.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const handleMedicationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      currentMedications: e.target.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.address) {
      setError("Please fill in all required personal information fields.")
      return
    }

    try {
      const localDB = getLocalDB()
      let savedPatient: Patient

      if (initialData) {
        savedPatient = await localDB.updatePatient(formData as Patient)
        toast({
          title: "Patient Updated",
          description: `${formData.name}'s profile has been updated.`,
        })
      } else {
        savedPatient = await localDB.addPatient(formData)
        toast({
          title: "Patient Added",
          description: `${formData.name} has been added as a new patient.`,
        })
      }
      onSave(savedPatient)
    } catch (err) {
      console.error("Failed to save patient:", err)
      setError("Failed to save patient. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save patient.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Patient Profile" : "Add New Patient"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <h3 className="text-lg font-semibold mt-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value as "male" | "female")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6">Medical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Input
                id="bloodType"
                value={formData.bloodType || ""}
                onChange={(e) => handleChange("bloodType", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ""}
                onChange={(e) => handleChange("height", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight || ""}
                onChange={(e) => handleChange("weight", Number.parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory || ""}
                onChange={(e) => handleChange("medicalHistory", e.target.value)}
                placeholder="Previous conditions, surgeries, etc."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allergies">Allergies (comma-separated)</Label>
              <Input
                id="allergies"
                value={formData.allergies.join(", ")}
                onChange={handleAllergiesChange}
                placeholder="e.g., Penicillin, Peanuts"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
              <Input
                id="currentMedications"
                value={formData.currentMedications.join(", ")}
                onChange={handleMedicationsChange}
                placeholder="e.g., Lisinopril, Metformin"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ecName">Name</Label>
              <Input
                id="ecName"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecPhone">Phone</Label>
              <Input
                id="ecPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecRelationship">Relationship</Label>
              <Input
                id="ecRelationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                required
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-6">Assigned Doctors</h3>
          <div className="space-y-2">
            <Label htmlFor="assignedDoctors">Assign Doctors</Label>
            <Select
              value={formData.assignedDoctorIds[0] || ""} // Assuming single select for simplicity, adjust for multi-select
              onValueChange={(value) => handleChange("assignedDoctorIds", value ? [value] : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Assigned Doctor(s)" />
              </SelectTrigger>
              <SelectContent>
                {allDoctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Select doctors who are assigned to this patient.</p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update Patient" : "Add Patient"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
