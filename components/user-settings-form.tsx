"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Doctor, Patient } from "@/lib/db"
import { AuthClientService } from "@/lib/auth-client"

interface UserSettingsFormProps {
  user: Patient | Doctor
  onSave: (updatedUser: Patient | Doctor) => void
}

export function UserSettingsForm({ user, onSave }: UserSettingsFormProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || "")
  const [address, setAddress] = useState(user.address || "")
  const [bio, setBio] = useState((user as Doctor).bio || "")
  const [specialty, setSpecialty] = useState((user as Doctor).specialty || "")
  const [dob, setDob] = useState((user as Patient).dob || "")
  const [gender, setGender] = useState((user as Patient).gender || "")
  const [medicalHistory, setMedicalHistory] = useState((user as Patient).medicalHistory || "")
  const [loading, setLoading] = useState(false)

  const isDoctor = user.role === "doctor"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let updatedUser: Patient | Doctor
      if (isDoctor) {
        updatedUser = {
          ...user,
          name,
          email,
          phone,
          address,
          bio,
          specialty,
        } as Doctor
        await AuthClientService.updateDoctorProfile(updatedUser)
      } else {
        updatedUser = {
          ...user,
          name,
          email,
          phone,
          address,
          dob,
          gender,
          medicalHistory,
        } as Patient
        await AuthClientService.updatePatientProfile(updatedUser)
      }
      onSave(updatedUser)

    } catch (error) {
      console.error("Failed to update profile:", error)

    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
      </div>

      {isDoctor ? (
        <>
          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Input id="specialty" type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
          </div>
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="medicalHistory">Medical History</Label>
            <Textarea
              id="medicalHistory"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={5}
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
