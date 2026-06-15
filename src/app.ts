import express from 'express'
import jwt from 'jsonwebtoken'
import swaggerUi from 'swagger-ui-express'

import { authRoutes } from './controller/auth-controller.js'
import { customerRoutes } from './controller/customer-controller.js'
import { eventsRoutes } from './controller/event-controller.js'
import { healthRoutes } from './controller/health-controller.js'
import { partnerRoutes } from './controller/partner-controller.js'
import { purchaseRoutes } from './controller/purchase-controller.js'
import { reservationRoutes } from './controller/reservation-controller.js'
import { ticketRoutes } from './controller/ticket-controller.js'
import { swaggerSpec } from './docs/swagger.js'
import { UserService } from './services/user-service.js'

export const app = express()

app.use(express.json())

app.use(healthRoutes)

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

    const userService = new UserService()
    const user = await userService.findById(payload.id)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = user as { id: number; email: string }

    return next()
  } catch (_error) {
    return res.status(401).json({ message: 'Failed to authenticate token' })
  }
})

app.get('/', (_req, res) => {
  return res.send('Hello World!')
})

app.use('/auth', authRoutes)
app.use('/partners', partnerRoutes)
app.use('/customers', customerRoutes)
app.use('/events', eventsRoutes)
app.use('/partners/events', ticketRoutes)
app.use('/partners/events/reservations', reservationRoutes) // ✅ CORREÇÃO
app.use('/partners/events/purchases', purchaseRoutes)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
