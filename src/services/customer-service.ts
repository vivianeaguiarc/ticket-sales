import bcrypt from 'bcrypt'
import * as mysql from 'mysql2/promise'
import { UserModel } from '../models/user-model.js'
import { Database } from '../database.js'

export class CustomerService {
  async register(data: {
    name: string
    email: string
    password: string
    address: string
    phone: string
  }) {
   const { name, email, password, address, phone } = data
    const connection = Database.getInstance()

    try {
      const createdAt = new Date()
      const hashedPassword = bcrypt.hashSync(password, 10)
      const userModel = await UserModel.create({ name, email, password: hashedPassword })
      const userId = userModel.id

      const [customerResult] = await connection.execute<mysql.ResultSetHeader>(
        'INSERT INTO customers (user_id, address, phone, created_at) VALUES (?, ?, ?, ?)',
        [userId, address, phone, createdAt]
      )

      return {
        id: customerResult.insertId,
        userId,
        name,
        address,
        phone,
        createdAt
      }
    } finally { 
    }
  }
}
