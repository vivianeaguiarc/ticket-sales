import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByUserIdMock, createManyMock } = vi.hoisted(() => {
  return {
    findByUserIdMock: vi.fn(),
    createManyMock: vi.fn()
  }
})

vi.mock('../services/partner-service.js', () => {
  return {
    PartnerService: class {
      findByUserId = findByUserIdMock
    }
  }
})

vi.mock('../services/ticket-service.js', () => {
  return {
    TicketService: class {
      createMany = createManyMock
    }
  }
})

import { ticketRoutes } from './ticket-controller.js'

describe('TicketController', () => {
  const app = express()

  app.use(express.json())

  app.use((req, _res, next) => {
    req.user = { id: 1, email: 'partner@email.com' }
    next()
  })

  app.use('/partners/events', ticketRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve criar tickets com sucesso para um partner autorizado', async () => {
    const mockPartner = {
      id: 99,
      user_id: 1,
      company_name: 'Minha Empresa'
    }

    findByUserIdMock.mockResolvedValue(mockPartner)
    createManyMock.mockResolvedValue(undefined)

    const response = await request(app).post('/partners/events/1/tickets').send({
      numTickets: 10,
      price: 150
    })

    expect(response.status).toBe(204)
    expect(response.text).toBe('')

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createManyMock).toHaveBeenCalledWith({
      eventId: 1,
      numTickets: 10,
      price: 150
    })
  })

  test('deve retornar 403 se o usuário não for partner', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app).post('/partners/events/1/tickets').send({
      numTickets: 10,
      price: 150
    })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Only partners can create tickets'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createManyMock).not.toHaveBeenCalled()
  })
})
