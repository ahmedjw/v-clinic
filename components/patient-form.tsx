"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AuthClientService } from "@/lib/auth-client"
import type { Patient } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Spinner } from "./ui/spinner"

interface PatientFormProps {
  onRegister: (patient: Patient) => void
  onCancel: () => void
}

export function PatientForm({ onRegister, onCancel }: PatientFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("")
  const [address, setAddress] = useState("")
  const [medicalHistory, setMedicalHistory] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newPatient: any = {
        name,
        email,
        password,
        role: "patient",
        phone,
        dob,
        gender,
        address,
        medicalHistory,
      }
      const registeredPatient = await AuthClientService.register(newPatient)
      onRegister(registeredPatient as Patient)
      toast({
        title: "Registration Successful!",
        description: "Your patient account has been created.",
      })
    } catch (error: any) {
      console.error("Patient registration failed:", error)
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div className="space-y-2">
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
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="medicalHistory">Medical History</Label>
          <Textarea
            id="medicalHistory"
            placeholder="Any relevant medical history, allergies, etc."
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2" /> : null}
          {loading ? "Registering..." : "Register"}
        </Button>
      </div>
    </form>
  )
}
