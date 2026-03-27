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

// app.post('/events', async (req, res) => {
//   const { name, description, date, location } = req.body

//   const connection = await createConnection()

//   try {
//     const eventDate = new Date(date)
//     const createdAt = new Date()

//     const [eventResult] = await connection.execute<mysql.ResultSetHeader>(
//       'INSERT INTO events (name, description, date, location, created_at) VALUES (?, ?, ?, ?, ?)',
//       [name, description, eventDate, location, createdAt]
//     )

//     return res.status(201).json({
//       id: eventResult.insertId,
//       name,
//       description,
//       date: eventDate,
//       location,
//       created_at: createdAt
//     })
//   } finally {
//     await connection.end()
//   }
// })
app.post('/partners/events', async (req, res) => {
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

app.get('/events', async (req, res) => {
  const connection = await createConnection()
  try {
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>('SELECT * FROM events')
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
app.get('/events/:eventId', async (req, res) => {
  const { eventId } = req.params

  const connection = await createConnection()

  try {
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    )
    const event = eventRows.length ? eventRows[0] : null
    if (!event) {
      res.status(404).json({ message: 'Event not found' })
    }

    res.json(eventRows)
  } finally {
    await connection.end()
  }
})
app.get('/partners/events', async (_req, res) => {
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
    const [eventRows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM events WHERE partner_id = ?',
      [partner.id]
    )
    res.json(eventRows)
  } finally {
    await connection.end()
  }
})
app.get('/partners/events/:eventId', async (req, res) => {
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
    const { eventId } = req.params
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

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
