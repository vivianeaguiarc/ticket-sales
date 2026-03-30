import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  findByUserIdMock,
  createManyMock,
  findByEventIdMock,
  findByIdMock,
  reserveTicketExecuteMock,
  purchaseTicketExecuteMock,
  cancelPurchaseExecuteMock
} = vi.hoisted(() => {
  return {
    findByUserIdMock: vi.fn(),
    createManyMock: vi.fn(),
    findByEventIdMock: vi.fn(),
    findByIdMock: vi.fn(),
    reserveTicketExecuteMock: vi.fn(),
    purchaseTicketExecuteMock: vi.fn(),
    cancelPurchaseExecuteMock: vi.fn()
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
      findByEventId = findByEventIdMock
      findById = findByIdMock
    }
  }
})

vi.mock('../use-cases/reserve-ticket-use-case.js', () => {
  return {
    ReserveTicketUseCase: {
      execute: reserveTicketExecuteMock
    }
  }
})

vi.mock('../use-cases/purchase-ticket-use-case.js', () => {
  return {
    PurchaseTicketUseCase: {
      execute: purchaseTicketExecuteMock
    }
  }
})

vi.mock('../use-cases/cancel-purchase-use-case.js', () => {
  return {
    CancelPurchaseUseCase: {
      execute: cancelPurchaseExecuteMock
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
    vi.resetAllMocks()
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
      num_tickets: 10,
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
      num_tickets: 10,
      price: 150
    })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createManyMock).not.toHaveBeenCalled()
  })

  test('deve listar tickets por evento com sucesso', async () => {
    const tickets = [
      { id: 1, event_id: 1, price: 100, status: 'available' },
      { id: 2, event_id: 1, price: 100, status: 'available' }
    ]

    findByEventIdMock.mockResolvedValue(tickets)

    const response = await request(app).get('/partners/events/1/tickets')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(tickets)
    expect(findByEventIdMock).toHaveBeenCalledWith(1)
  })

  test('deve buscar um ticket por id com sucesso', async () => {
    const ticket = { id: 1, event_id: 1, price: 100, status: 'available' }

    findByIdMock.mockResolvedValue(ticket)

    const response = await request(app).get('/partners/events/1/tickets/1')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(ticket)
    expect(findByIdMock).toHaveBeenCalledWith(1, 1)
  })

  test('deve retornar 404 ao buscar ticket inexistente', async () => {
    findByIdMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/1/tickets/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Ticket not found'
    })

    expect(findByIdMock).toHaveBeenCalledWith(1, 999)
  })

  test('deve reservar tickets com sucesso', async () => {
    const reservations = [
      { id: 1, customer_id: 1, ticket_id: 101, status: 'reserved' },
      { id: 2, customer_id: 1, ticket_id: 102, status: 'reserved' }
    ]

    reserveTicketExecuteMock.mockResolvedValue(reservations)

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({
        ticket_ids: [101, 102]
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(reservations)
    expect(reserveTicketExecuteMock).toHaveBeenCalledWith({
      customer_id: 1,
      ticket_ids: [101, 102]
    })
  })

  test('deve retornar 400 ao reservar tickets com dados inválidos', async () => {
    reserveTicketExecuteMock.mockRejectedValue(new Error('At least one ticket id is required'))

    const response = await request(app).post('/partners/events/reservations').send({
      ticket_ids: []
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'At least one ticket id is required'
    })
  })

  test('deve retornar 409 ao reservar ticket indisponível', async () => {
    reserveTicketExecuteMock.mockRejectedValue(new Error('Ticket is no longer available'))

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({
        ticket_ids: [101]
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: 'Ticket is no longer available'
    })
  })

  test('deve comprar tickets com sucesso', async () => {
    const purchaseTickets = [
      { id: 1, purchase_id: 10, ticket_id: 101 },
      { id: 2, purchase_id: 10, ticket_id: 102 }
    ]

    purchaseTicketExecuteMock.mockResolvedValue(purchaseTickets)

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        purchase_id: 10,
        ticket_ids: [101, 102]
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(purchaseTickets)
    expect(purchaseTicketExecuteMock).toHaveBeenCalledWith({
      purchase_id: 10,
      ticket_ids: [101, 102]
    })
  })

  test('deve retornar 400 ao comprar tickets com dados inválidos', async () => {
    purchaseTicketExecuteMock.mockRejectedValue(new Error('Purchase id is required'))

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        purchase_id: 0,
        ticket_ids: [101]
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'Purchase id is required'
    })
  })

  test('deve retornar 409 ao comprar ticket indisponível', async () => {
    purchaseTicketExecuteMock.mockRejectedValue(new Error('Ticket is no longer available'))

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        purchase_id: 10,
        ticket_ids: [101]
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: 'Ticket is no longer available'
    })
  })

  test('deve cancelar compra com sucesso', async () => {
    cancelPurchaseExecuteMock.mockResolvedValue(undefined)

    const response = await request(app).delete('/partners/events/purchases/10')

    expect(response.status).toBe(204)
    expect(response.text).toBe('')
    expect(cancelPurchaseExecuteMock).toHaveBeenCalledWith({
      purchase_id: 10
    })
  })

  test('deve retornar 404 ao cancelar compra inexistente', async () => {
    cancelPurchaseExecuteMock.mockRejectedValue(new Error('Purchase tickets not found'))

    const response = await request(app).delete('/partners/events/purchases/10')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Purchase tickets not found'
    })
  })
})
