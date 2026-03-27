import bcrypt from 'bcrypt'
import { Router } from 'express'
import * as mysql from 'mysql2/promise'

import { createConnection } from '../database.js'

export const partnerRoutes = Router()
partnerRoutes.post('/register', async (_req, res) => {
  const { name, email, password, company_name } = _req.body
  const connection = await createConnection()

  try {
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

    return res.status(201).json({
      id: partnerResult.insertId,
      userId,
      company_name,
      createdAt
    })
  } catch (error) {
    console.error('Error creating partner:', error)

    return res.status(500).json({
      message: 'Internal server error'
    })
  } finally {
    await connection.end()
  }
})
partnerRoutes.post('/events', async (req, res) => {
  const { name, description, date, location } = req.body

  const userId = req.user!.id

  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM partners WHERE user_id = ?',
      [userId]
    )

    const partner = rows.length ? rows[0] : null

    if (!partner) {
      res.status(403).json({ message: 'Not authorized' })
      return
    }
    const eventDate = new Date(date)
    const createdAt = new Date()
    const [eventResult] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO events (partner_id, name, description, date, location, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [partner.id, name, description, eventDate, location, createdAt]
    )

    return res.status(201).json({
      id: eventResult.insertId,
      partner_id: partner.id,
      name,
      description,
      date: eventDate,
      location,
      created_at: createdAt
    })
  } finally {
    await connection.end()
  }
})
partnerRoutes.get('/events/:eventId', async (_req, res) => {
  const userId = _req.user!.id

  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM partners WHERE user_id = ?',
      [userId]
    )

    const partner = rows.length ? rows[0] : null

    if (!partner) {
      res.status(403).json({ message: 'Not authorized' })
      return
    }
    const { eventId } = _req.params
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM events WHERE partner_id = ? and id = ?',
      [partner.id, eventId]
    )
    const event = eventRows.length ? eventRows[0] : null
    if (!event) {
      res.status(404).json({ message: 'Event not found' })
      return
    }
    res.json(event)
  } finally {
    await connection.end()
  }
})
