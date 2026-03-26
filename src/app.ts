import bcrypt from 'bcrypt'
import express from 'express'
import * as mysql from 'mysql2/promise'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './docs/swagger.js'

function createConnextion() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tickets',
    port: 3307
  })
}

export const app = express()
app.use(express.json())

app.get('/', (_req, res) => {
  return res.send('Hello World!')
})

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  console.log(`Login attempt with email: ${email} and password: ${password}`)

  return res.send({ message: 'Login successful' })
})

app.post('/partners', async (_req, res) => {
  const { name, email, password, company_name } = _req.body
  const connection = await createConnextion()

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
app.post('/customers', (_req, res) => {
  return res.status(501).send({ message: 'Route not implemented yet' })
})

app.post('/events', (_req, res) => {
  return res.status(501).send({ message: 'Route not implemented yet' })
})

app.get('/events', (_req, res) => {
  return res.status(501).send({ message: 'Route not implemented yet' })
})

app.get('/events/:eventId', (req, res) => {
  const { eventId } = req.params
  console.log(`Fetching details for event ID: ${eventId}`)

  return res.send({ message: `Details for event ID: ${eventId}` })
})

app.get('/partners/events', (_req, res) => {
  return res.status(501).send({ message: 'Route not implemented yet' })
})

app.get('/partners/events/:eventId', (req, res) => {
  const { eventId } = req.params
  console.log(`Fetching details for event ID: ${eventId}`)

  return res.send({ message: `Details for event ID: ${eventId}` })
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
