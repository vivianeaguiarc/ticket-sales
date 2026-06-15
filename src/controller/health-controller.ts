import { Router } from 'express'

import { HealthService } from '../services/health-service.js'

export const healthRoutes = Router()

healthRoutes.get('/health', async (_req, res) => {
  const healthService = new HealthService()
  const timestamp = new Date().toISOString()
  const isDatabaseConnected = await healthService.checkDatabase()

  if (!isDatabaseConnected) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp
    })
    return
  }

  res.status(200).json({
    status: 'ok',
    database: 'connected',
    timestamp
  })
})

healthRoutes.get('/ready', async (_req, res) => {
  const healthService = new HealthService()
  const isDatabaseConnected = await healthService.checkDatabase()

  if (!isDatabaseConnected) {
    res.status(503).json({ ready: false })
    return
  }

  res.status(200).json({ ready: true })
})
