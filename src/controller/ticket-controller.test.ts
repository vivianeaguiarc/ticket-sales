import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Ticket, TicketStatus } from '../domain/entities/ticket.js'

const {
  findPartnerByUserIdMock,
  findCustomerByUserIdMock,
  createTicketsExecuteMock,
  getEventTicketsExecuteMock,
  getTicketByIdExecuteMock,
  reserveTicketExecuteMock,
  purchaseTicketExecuteMock,
  cancelPurchaseExecuteMock
} = vi.hoisted(() => {
  return {
    findPartnerByUserIdMock: vi.fn(),
    findCustomerByUserIdMock: vi.fn(),
    createTicketsExecuteMock: vi.fn(),
    getEventTicketsExecuteMock: vi.fn(),
    getTicketByIdExecuteMock: vi.fn(),
    reserveTicketExecuteMock: vi.fn(),
    purchaseTicketExecuteMock: vi.fn(),
    cancelPurchaseExecuteMock: vi.fn()
  }
})

vi.mock('../services/partner-service.js', () => {
  return {
    PartnerService: class {
      findByUserId = findPartnerByUserIdMock
    }
  }
})

vi.mock('../services/customer-service.js', () => {
  return {
    CustomerService: class {
      findByUserId = findCustomerByUserIdMock
    }
  }
})

vi.mock('../infra/composition/ticket-factory.js', () => {
  return {
    getCreateTicketsUseCase: () => ({
      execute: createTicketsExecuteMock
    }),
    getGetEventTicketsUseCase: () => ({
      execute: getEventTicketsExecuteMock
    }),
    getGetTicketByIdUseCase: () => ({
      execute: getTicketByIdExecuteMock
    })
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
    req.user = { id: 1, email: 'user@email.com' }
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

    findPartnerByUserIdMock.mockResolvedValue(mockPartner)
    createTicketsExecuteMock.mockResolvedValue(undefined)

    const response = await request(app).post('/partners/events/1/tickets').send({
      num_tickets: 10,
      price: 150
    })

    expect(response.status).toBe(204)
    expect(response.text).toBe('')

    expect(findPartnerByUserIdMock).toHaveBeenCalledWith(1)
    expect(createTicketsExecuteMock).toHaveBeenCalledWith({
      eventId: 1,
      numTickets: 10,
      price: 150,
      userId: 1
    })
  })

  test('deve retornar 403 se o usuário não for partner', async () => {
    findPartnerByUserIdMock.mockResolvedValue(null)

    const response = await request(app).post('/partners/events/1/tickets').send({
      num_tickets: 10,
      price: 150
    })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })

    expect(findPartnerByUserIdMock).toHaveBeenCalledWith(1)
    expect(createTicketsExecuteMock).not.toHaveBeenCalled()
  })

  test('deve listar tickets por evento com sucesso', async () => {
    const createdAt = new Date('2027-01-01T00:00:00.000Z')
    const tickets = [
      new Ticket(1, 1, 'Location 0', 100, TicketStatus.available, createdAt),
      new Ticket(2, 1, 'Location 1', 100, TicketStatus.available, createdAt)
    ]

    getEventTicketsExecuteMock.mockResolvedValue(tickets)

    const response = await request(app).get('/partners/events/1/tickets')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      {
        id: 1,
        event_id: 1,
        location: 'Location 0',
        price: 100,
        status: TicketStatus.available,
        created_at: createdAt.toISOString()
      },
      {
        id: 2,
        event_id: 1,
        location: 'Location 1',
        price: 100,
        status: TicketStatus.available,
        created_at: createdAt.toISOString()
      }
    ])
    expect(getEventTicketsExecuteMock).toHaveBeenCalledWith({ eventId: 1 })
  })

  test('deve buscar um ticket por id com sucesso', async () => {
    const createdAt = new Date('2027-01-01T00:00:00.000Z')
    const ticket = new Ticket(1, 1, 'Location 0', 100, TicketStatus.available, createdAt)

    getTicketByIdExecuteMock.mockResolvedValue(ticket)

    const response = await request(app).get('/partners/events/1/tickets/1')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 1,
      event_id: 1,
      location: 'Location 0',
      price: 100,
      status: TicketStatus.available,
      created_at: createdAt.toISOString()
    })
    expect(getTicketByIdExecuteMock).toHaveBeenCalledWith({ eventId: 1, ticketId: 1 })
  })

  test('deve retornar 404 ao buscar ticket inexistente', async () => {
    getTicketByIdExecuteMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/1/tickets/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Ticket not found'
    })

    expect(getTicketByIdExecuteMock).toHaveBeenCalledWith({ eventId: 1, ticketId: 999 })
  })

  test('deve reservar tickets com sucesso', async () => {
    const customer = {
      id: 10,
      user_id: 1
    }

    const reservations = [
      { id: 1, customer_id: 10, ticket_id: 101, status: 'reserved' },
      { id: 2, customer_id: 10, ticket_id: 102, status: 'reserved' }
    ]

    findCustomerByUserIdMock.mockResolvedValue(customer)
    reserveTicketExecuteMock.mockResolvedValue(reservations)

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({
        ticket_ids: [101, 102]
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(reservations)
    expect(findCustomerByUserIdMock).toHaveBeenCalledWith(1)
    expect(reserveTicketExecuteMock).toHaveBeenCalledWith({
      customer_id: 10,
      ticket_ids: [101, 102]
    })
  })

  test('deve retornar 403 ao reservar se usuário não for customer', async () => {
    findCustomerByUserIdMock.mockResolvedValue(null)

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({
        ticket_ids: [101]
      })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })
  })

  test('deve retornar 400 ao reservar tickets com dados inválidos', async () => {
    const customer = {
      id: 10,
      user_id: 1
    }

    findCustomerByUserIdMock.mockResolvedValue(customer)
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
    const customer = {
      id: 10,
      user_id: 1
    }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    reserveTicketExecuteMock.mockRejectedValue(new Error('Ticket 101 is not available'))

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({
        ticket_ids: [101]
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: 'Ticket 101 is not available'
    })
  })

  test('deve comprar tickets com sucesso', async () => {
    const customer = {
      id: 10,
      user_id: 1
    }

    const purchase = {
      id: 1,
      customer_id: 10,
      total_amount: 350,
      status: 'paid'
    }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    purchaseTicketExecuteMock.mockResolvedValue(purchase)

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [101, 102]
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(purchase)
    expect(findCustomerByUserIdMock).toHaveBeenCalledWith(1)
    expect(purchaseTicketExecuteMock).toHaveBeenCalledWith({
      customer_id: 10,
      ticket_ids: [101, 102]
    })
  })

  test('deve retornar 403 ao comprar se usuário não for customer', async () => {
    findCustomerByUserIdMock.mockResolvedValue(null)

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [101]
      })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({
      message: 'Not authorized'
    })
  })

  test('deve retornar 400 ao comprar tickets com dados inválidos', async () => {
    const customer = {
      id: 10,
      user_id: 1
    }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    purchaseTicketExecuteMock.mockRejectedValue(new Error('At least one ticket id is required'))

    const response = await request(app).post('/partners/events/purchases').send({
      ticket_ids: []
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'At least one ticket id is required'
    })
  })

  test('deve retornar 409 ao comprar ticket indisponível', async () => {
    const customer = {
      id: 10,
      user_id: 1
    }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    purchaseTicketExecuteMock.mockRejectedValue(new Error('Ticket 101 is not available'))

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [101]
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: 'Ticket 101 is not available'
    })
  })

  test('deve cancelar compra com sucesso', async () => {
    cancelPurchaseExecuteMock.mockResolvedValue(undefined)

    const response = await request(app).delete('/partners/events/purchases/10')

    expect(response.status).toBe(204)
    expect(response.text).toBe('')
    expect(cancelPurchaseExecuteMock).toHaveBeenCalledWith({
      purchase_id: 10,
      user_id: 1
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

  test('deve retornar ticket por id com sucesso', async () => {
    const createdAt = new Date('2027-01-01T00:00:00.000Z')
    const ticket = new Ticket(5, 1, 'Location 0', 100, TicketStatus.available, createdAt)

    getTicketByIdExecuteMock.mockResolvedValue(ticket)

    const response = await request(app).get('/partners/events/1/tickets/5')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      id: 5,
      event_id: 1,
      location: 'Location 0',
      price: 100,
      status: TicketStatus.available,
      created_at: createdAt.toISOString()
    })
  })

  test('deve retornar 404 ao buscar ticket inexistente', async () => {
    getTicketByIdExecuteMock.mockResolvedValue(null)

    const response = await request(app).get('/partners/events/1/tickets/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Ticket not found' })
  })

  test('deve retornar 409 ao cancelar compra já cancelada', async () => {
    cancelPurchaseExecuteMock.mockRejectedValue(new Error('Purchase already cancelled'))

    const response = await request(app).delete('/partners/events/purchases/10')

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: 'Purchase already cancelled' })
  })

  test('deve retornar 400 ao cancelar compra com id inválido', async () => {
    cancelPurchaseExecuteMock.mockRejectedValue(new Error('Purchase id is required'))

    const response = await request(app).delete('/partners/events/purchases/0')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: 'Purchase id is required' })
  })

  test('deve retornar 404 ao comprar tickets não encontrados', async () => {
    const customer = { id: 10, user_id: 1 }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    purchaseTicketExecuteMock.mockRejectedValue(new Error('One or more tickets not found'))

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({ ticket_ids: [999] })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'One or more tickets not found' })
  })

  test('deve retornar 500 em erro inesperado na reserva', async () => {
    const customer = { id: 10, user_id: 1 }

    findCustomerByUserIdMock.mockResolvedValue(customer)
    reserveTicketExecuteMock.mockRejectedValue(new Error('Unexpected'))

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [1] })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ message: 'Internal server error' })
  })
})
