import bcrypt from 'bcrypt'
import { Router } from 'express'
import * as mysql from 'mysql2/promise'

import { createConnection } from '../database.js'

export const customerRoutes = Router()
customerRoutes.post('/register', async (req, res) => {
  const { name, email, password, address, phone } = req.body
  const connection = await createConnection()

  try {
    const createdAt = new Date()
    const hashedPassword = bcrypt.hashSync(password, 10)

    const [userResult] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, createdAt]
    )

    const userId = userResult.insertId

    const [customerResult] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO customers (user_id, address, phone, created_at) VALUES (?, ?, ?, ?)',
      [userId, address, phone, createdAt]
    )

    return res.status(201).json({
      id: customerResult.insertId,
      userId,
      name,
      address,
      phone,
      createdAt
    })
  } catch (error) {
    console.error('Error creating customer:', error)

    return res.status(500).json({
      message: 'Internal server error'
    })
  } finally {
    await connection.end()
  }
})
