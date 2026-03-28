import bcrypt from 'bcrypt'
import * as mysql from 'mysql2/promise'

import { Database } from '../database.js'

export class PartnerService {
  async register(data: { name: string; email: string; password: string; company_name: string }) {
    const { name, email, password, company_name } = data
    const connection = Database.getInstance()

    try {
      await connection.beginTransaction()
      const createdAt = new Date()
      const hashedPassword = bcrypt.hashSync(password, 10)

      const [userResult] = await connection.execute<mysql.ResultSetHeader>(
        'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, createdAt]
      )

      const userId = userResult.insertId

      const [partnerResult] = await connection.execute<mysql.ResultSetHeader>(
        'INSERT INTO partners (user_id, company_name, created_at) VALUES (?, ?, ?)',
        [userId, company_name, createdAt]
      )
      await connection.commit()
      return {
        id: partnerResult.insertId,
        name,
        userId,
        company_name,
        createdAt
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      await connection.end()
    }
  }
  async findByUserId(userId: number) {
    const connection = Database.getInstance()
    try {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM partners WHERE user_id = ?',
        [userId]
      )
      return rows.length ? rows[0] : null
    } finally {
    }
  }
}
