import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { checkDatabaseMock } = vi.hoisted(() => {
  return {
    checkDatabaseMock: vi.fn()
  }
})

vi.mock('../services/health-service.js', () => {
  return {
    HealthService: class {
      checkDatabase = checkDatabaseMock
    }
  }
})

import { healthRoutes } from './health-controller.js'

describe('HealthController', () => {
  const app = express()

  app.use(healthRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('health deve retornar 200 quando banco estiver disponível', async () => {
    checkDatabaseMock.mockResolvedValue(true)

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.body.database).toBe('connected')
    expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  test('health deve retornar database connected', async () => {
    checkDatabaseMock.mockResolvedValue(true)

    const response = await request(app).get('/health')

    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
      timestamp: expect.any(String)
    })
  })

  test('health deve retornar erro quando banco estiver indisponível', async () => {
    checkDatabaseMock.mockResolvedValue(false)

    const response = await request(app).get('/health')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({
      status: 'error',
      database: 'disconnected',
      timestamp: expect.any(String)
    })
  })

  test('ready deve retornar true quando banco estiver disponível', async () => {
    checkDatabaseMock.mockResolvedValue(true)

    const response = await request(app).get('/ready')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ready: true })
  })

  test('ready deve retornar false quando banco estiver indisponível', async () => {
    checkDatabaseMock.mockResolvedValue(false)

    const response = await request(app).get('/ready')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ ready: false })
  })
})
