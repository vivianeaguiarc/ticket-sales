import bcrypt from 'bcrypt'
import express from 'express'
import jwt from 'jsonwebtoken'
import * as mysql from 'mysql2/promise'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './docs/swagger.js'

function createConnection() {
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

const unprotectedRoutes = [
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/partners/register' },
  { method: 'POST', path: '/customers/register' },
  { method: 'GET', path: '/events' }
]

app.use(async (req, res, next) => {
  const isUnprotected = unprotectedRoutes.some(
    (route) => route.method === req.method && req.path.startsWith(route.path)
  )

  if (isUnprotected) {
    return next()
  }

  const token = req.headers['authorization']?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const payload = jwt.verify(token, 'your_secret_key') as {
      id: number
      email: string
    }

    const connection = await createConnection()

    try {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [payload.id]
      )

      const user = rows.length ? rows[0] : null

      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }

      req.user = user as { id: number; email: string }

      return next()
    } finally {
      await connection.end()
    }
  } catch (_error) {
    return res.status(401).json({ message: 'Failed to authenticate token' })
  }
})

app.get('/', (_req, res) => {
  return res.send('Hello World!')
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  const connection = await createConnection()

  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    const user = rows.length ? rows[0] : null

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email }, 'your_secret_key', {
        expiresIn: '1h'
      })

      return res.json({ token })
    }

    return res.status(401).json({ message: 'Invalid email or password' })
  } finally {
    await connection.end()
  }
})

app.post('/partners/register', async (_req, res) => {
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

app.post('/customers/register', async (_req, res) => {
  const { name, email, password, address, phone } = _req.body
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
