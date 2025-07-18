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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Doctor, Patient, User } from "@/lib/db"
import { getLocalDB } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { AuthClientService } from "@/lib/auth-client"

interface UserSettingsFormProps {
  user: User | Patient
  onClose: () => void
  onSave: (updatedUser: User) => void
}

export function UserSettingsForm({ user, onClose, onSave }: UserSettingsFormProps) {
  const [formData, setFormData] = useState<User | Patient>(user)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const authService = new AuthClientService()

  const handleChange = (field: string, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (
    field: "education" | "experience",
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const localDB = getLocalDB()
      let updatedUser: User

      if (formData.role === "doctor") {
        updatedUser = await localDB.updateDoctor(formData as any)
      } else {
        updatedUser = await localDB.updatePatient(formData as any)
      }

      // Also update in AuthClientService's mock users if necessary
      authService.updateMockUser(updatedUser)

      onSave(updatedUser)
      toast({
        title: "Settings Saved",
        description: "Your profile settings have been updated.",
      })
      onClose()
    } catch (err) {
      console.error("Failed to save settings:", err)
      setError("Failed to save settings. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>Update your profile information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
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
                />
              </div>
              {formData.role === "patient" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={(formData as Patient).gender || "male"}
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
                      value={(formData as Patient).address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {formData.role === "doctor" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Doctor Specific Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Select
                    value={(formData as Doctor).specialization || ""}
                    onValueChange={(value) => handleChange("specialization", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Medicine</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="psychiatry">Psychiatry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={(formData as Doctor).licenseNumber || ""}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="education">Education (one per line)</Label>
                  <Textarea
                    id="education"
                    value={(formData as Doctor).education || [].join("\n")}
                    onChange={(e) => handleArrayChange("education", e)}
                    placeholder="e.g., MD, Harvard Medical School"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="experience">Experience (one per line)</Label>
                  <Textarea
                    id="experience"
                    value={(formData as Doctor).experience || [].join("\n")}
                    onChange={(e) => handleArrayChange("experience", e)}
                    placeholder="e.g., 5 years at City Hospital"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {formData.role === "patient" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Input
                    id="bloodType"
                    value={(formData as Patient).bloodType || ""}
                    onChange={(e) => handleChange("bloodType", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={(formData as Patient).height || ""}
                    onChange={(e) => handleChange("height", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={(formData as Patient).weight || ""}
                    onChange={(e) => handleChange("weight", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    id="medicalHistory"
                    value={(formData as Patient).medicalHistory || ""}
                    onChange={(e) => handleChange("medicalHistory", e.target.value)}
                    placeholder="Previous conditions, surgeries, etc."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    value={((formData as Patient).allergies || []).join(", ")}
                    onChange={(e) =>
                      handleChange(
                        "allergies",
                        e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="e.g., Penicillin, Peanuts"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
                  <Input
                    id="currentMedications"
                    value={((formData as Patient).currentMedications || []).join(", ")}
                    onChange={(e) =>
                      handleChange(
                        "currentMedications",
                        e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="e.g., Lisinopril, Metformin"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={(formData as Patient).emergencyContact?.name || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: { ...(prev as Patient).emergencyContact, name: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={(formData as Patient).emergencyContact?.phone || ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev.role === "patient"
                          ? {
                            ...prev,
                            emergencyContact: { ...(prev as Patient).emergencyContact, phone: e.target.value },
                          }
                          : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergencyContactRelationship">Emergency Contact Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={(formData as Patient).emergencyContact?.relationship || ""}
                    onChange={(e) =>
                      setFormData((prev) =>
                        prev.role === "patient"
                          ? {
                            ...prev,
                            emergencyContact: {
                              ...(prev as Patient).emergencyContact,
                              relationship: e.target.value,
                            },
                          }
                          : prev
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
