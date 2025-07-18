"use server";

import "server-only";
import { cookies } from "next/headers";
import type { Doctor, Patient, User } from "./db";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// Simulated session verification
export async function verifySession(): Promise<User | null> {
  const cookieStore: Promise<ReadonlyRequestCookies> = cookies(); // ✅ correct type
  const session = (await cookieStore).get("session");

  if (!session?.value) return null;

  try {
    const mockUser: User = JSON.parse(session.value); // ⚠️ In production, use secure parsing!
    return mockUser;
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const mockUsers: User[] = [
    {
      id: "doc1",
      name: "Alice Smith",
      email: "doctor@example.com",
      password: "password",
      role: "doctor",
      specialty: "Cardiology",
      bio: "Experienced cardiologist with a focus on preventive care.",
      phone: "555-111-2222",
      address: "123 Health St",
    } as Doctor,
    {
      id: "pat1",
      name: "Bob Johnson",
      email: "patient@example.com",
      password: "password",
      role: "patient",
      phone: "555-333-4444",
      dob: "1990-01-15",
      gender: "male",
      address: "456 Wellness Ave",
      medicalHistory: "No significant medical history.",
    } as Patient,
  ];

  return mockUsers.find((user) => user.id === id) || null;
}

export async function serverLogin(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const cookieStore = cookies(); // ✅

  if (email === "doctor@example.com" && password === "password") {
    const user: User = {
      id: "doc1",
      name: "Alice Smith",
      email,
      password,
      role: "doctor",
      specialty: "Cardiology",
      bio: "Experienced cardiologist",
      phone: "555-111-2222",
      address: "123 Health St",
    } as Doctor;

    (await cookieStore).set("session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user };
  }

  if (email === "patient@example.com" && password === "password") {
    const user: User = {
      id: "pat1",
      name: "Bob Johnson",
      email,
      password,
      role: "patient",
      phone: "555-333-4444",
      dob: "1990-01-15",
      gender: "male",
      address: "456 Wellness Ave",
      medicalHistory: "No significant medical history.",
    } as Patient;

    (await cookieStore).set("session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return { success: true, user };
  }

  return { success: false, error: "Invalid credentials" };
}

export async function serverLogout() {
  "use server";
  const cookieStore = cookies(); // ✅
  (await cookieStore).delete("session");
}

// Placeholder for future auth framework integrations
export async function getServerSession() {
  console.warn("getServerSession called in client-focused PWA.");
  return null;
}

export async function auth() {
  console.warn("auth() called in client-focused PWA.");
  return { user: null };
}
