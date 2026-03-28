import * as mysql from 'mysql2/promise'

import { Database } from '../database.js'

export class UserService {
  async findById(userId: number) {
    const connection = Database.getInstance()

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    )

    return rows.length ? rows[0] : null
  }

  async findByEmail(email: string) {
    const connection = Database.getInstance()

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    return rows.length ? rows[0] : null
  }
}
