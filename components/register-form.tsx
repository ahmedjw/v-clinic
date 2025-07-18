"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PatientForm } from "./patient-form"
import type { Doctor, Patient } from "@/lib/db"
import { DoctorForm } from "./doctor-form"

interface RegisterFormProps {
  onRegister: (user: Patient | Doctor) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [activeTab, setActiveTab] = useState("patient")
  const [error, setError] = useState<string | null>(null)

  const handleRegistrationSuccess = (user: Patient | Doctor) => {
    onRegister(user)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Register</CardTitle>
        <CardDescription>Create your Virtual Clinic account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patient">Register as Patient</TabsTrigger>
            <TabsTrigger value="doctor">Register as Doctor</TabsTrigger>
          </TabsList>
          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <TabsContent value="patient" className="mt-4">
            <PatientForm onRegister={handleRegistrationSuccess} onCancel={onSwitchToLogin} />
          </TabsContent>
          <TabsContent value="doctor" className="mt-4">
            <DoctorForm onRegister={handleRegistrationSuccess} onCancel={onSwitchToLogin} />
          </TabsContent>
        </Tabs>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Button variant="link" onClick={onSwitchToLogin} className="p-0 h-auto">
            Login
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
