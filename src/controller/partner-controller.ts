import { Router } from 'express'
import * as mysql from 'mysql2/promise'

import { createConnection } from '../database.js'
import { EventService } from '../services/event-service.js'
import { PartnerService } from '../services/partner-service.js'

export const partnerRoutes = Router()
partnerRoutes.post('/events', async (_req, res) => {
  const { name, email, password, company_name } = _req.body
  const partnerService = new PartnerService()
  const result = await partnerService.register({ name, email, password, company_name })
  res.status(201).json(result)
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
    const eventService = new EventService()
    const result = await eventService.create({
      name,
      description,
      date,
      location,
      partnerId: partner.id
    })
    res.status(201).json(result)
  } finally {
    await connection.end()
  }
})
partnerRoutes.get('/events/', async (_req, res) => {
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
    const eventService = new EventService()
    const events = await eventService.findAll(partner.id)
    res.json(events)
  } finally {
    await connection.end()
  }
})
partnerRoutes.get('/events/:eventId', async (req, res) => {
  const { eventId } = req.params
  const userId = req.user!.id

  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM partners WHERE user_id = ?',
      [userId]
    )

    const partner = rows.length ? rows[0] : null

    if (!partner) {
      res.status(403).json({ message: 'Notauthorized' })
      return
    }

    const eventService = new EventService()
    const event = await eventService.findById(+eventId)

    if (!event || event.partner_id !== partner.id) {
      res.status(404).json({ message: 'Event not found' })
      return
    }
    res.json(event)
  } finally {
    await connection.end()
  }
})
