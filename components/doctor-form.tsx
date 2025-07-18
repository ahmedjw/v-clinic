"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Doctor, Patient } from "@/lib/db" // Assuming Doctor interface is defined in lib/db

interface DoctorFormProps {
    initialData?: Doctor
    onSubmit?: (doctorData: any) => void
    onCancel?: () => void
    isSubmitting?: boolean
    onRegister?: (doctor: Doctor | Patient) => void
}

export function DoctorForm({ initialData, onSubmit, onCancel, isSubmitting }: DoctorFormProps) {
    const [name, setName] = useState(initialData?.name || "")
    const [email, setEmail] = useState(initialData?.email || "")
    const [specialty, setSpecialty] = useState(initialData?.specialty || "")
    const [bio, setBio] = useState(initialData?.bio || "")
    const [phone, setPhone] = useState(initialData?.phone || "")
    const [address, setAddress] = useState(initialData?.address || "")
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setEmail(initialData.email)
            setSpecialty(initialData.specialty)
            setBio(initialData.bio)
            setPhone(initialData.phone || "")
            setAddress(initialData.address || "")
        }
    }, [initialData])

    const validate = () => {
        const newErrors: { [key: string]: string } = {}
        if (!name.trim()) newErrors.name = "Name is required."
        if (!email.trim()) {
            newErrors.email = "Email is required."
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid."
        }
        if (!specialty.trim()) newErrors.specialty = "Specialty is required."
        if (!bio.trim()) newErrors.bio = "Bio is required."
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            onSubmit?.({
                name,
                email,
                specialty,
                bio,
                phone,
                address,
            })
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Doctor Profile</CardTitle>
                <CardDescription>Update your professional information.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Dr. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                            id="specialty"
                            type="text"
                            placeholder="Cardiology"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            required
                        />
                        {errors.specialty && <p className="text-red-500 text-sm">{errors.specialty}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="A brief description of your professional background and expertise."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                        />
                        {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="123-456-7890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address (Optional)</Label>
                        <Input
                            id="address"
                            type="text"
                            placeholder="123 Main St, Anytown, USA"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Profile"}
                        </Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="w-full bg-transparent"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
