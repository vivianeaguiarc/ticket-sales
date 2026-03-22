import express from 'express'
import swaggerUi from 'swagger-ui-express'

// import * as mysql from 'mysql2/promise'
import { swaggerSpec } from './docs/swagger.js'

const app = express()

app.use(express.json())

app.get('/', (_req, res) => {
  return res.send('Hello World!')
})

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body
  console.log(`Login attempt with email: ${email} and password: ${password}`)

  return res.send({ message: 'Login successful' })
})

app.post('/partners', (_req, res) => {
  return res.status(501).send({ message: 'Route not implemented yet' })
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

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000')
  console.log('📚 Swagger on http://localhost:3000/docs')
})
