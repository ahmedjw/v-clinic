import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { pool } from "./database"
import type { User } from "./database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const SALT_ROUNDS = 12

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
  }

  static verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch {
      return null
    }
  }

  static async createUser(userData: {
    email: string
    password: string
    name: string
    role: "doctor" | "patient"
    phone?: string
    specialization?: string
    license_number?: string
  }): Promise<User> {
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Check if user already exists
      const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [userData.email])

      if (existingUser.rows.length > 0) {
        throw new Error("User already exists")
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password)

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role, phone, specialization, license_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name, role, phone, specialization, license_number, created_at, updated_at`,
        [
          userData.email,
          passwordHash,
          userData.name,
          userData.role,
          userData.phone || null,
          userData.specialization || null,
          userData.license_number || null,
        ],
      )

      const user = userResult.rows[0]

      // If patient, create patient record
      if (userData.role === "patient") {
        const patientResult = await client.query(
          `INSERT INTO patients (user_id, name, email, phone, date_of_birth, gender, address, 
           emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
           medical_history, allergies, current_medications)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id`,
          [
            user.id,
            userData.name,
            userData.email,
            userData.phone || "",
            "1990-01-01", // Default date, should be updated
            "other", // Default gender, should be updated
            "", // Default address, should be updated
            "", // Default emergency contact, should be updated
            "",
            "",
            "",
            [],
            [],
          ],
        )

        // Update user with patient_id
        await client.query("UPDATE users SET patient_id = $1 WHERE id = $2", [patientResult.rows[0].id, user.id])

        user.patient_id = patientResult.rows[0].id
      }

      await client.query("COMMIT")
      return user
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    const isValidPassword = await this.verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return null
    }

    // Remove password hash from returned user
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  static async getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT id, email, name, role, phone, specialization, license_number, patient_id, created_at, updated_at FROM users WHERE id = $1",
      [id],
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  static async createSession(userId: string): Promise<string> {
    const sessionToken = this.generateToken(userId)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await pool.query("INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)", [
      userId,
      sessionToken,
      expiresAt,
    ])

    return sessionToken
  }

  static async validateSession(sessionToken: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.specialization, u.license_number, u.patient_id, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [sessionToken],
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  static async deleteSession(sessionToken: string): Promise<void> {
    await pool.query("DELETE FROM sessions WHERE session_token = $1", [sessionToken])
  }
}
