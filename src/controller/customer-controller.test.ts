import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { PurchaseStatus } from '../models/purchase-model.js'
import { ReservationStatus } from '../models/reservation-ticket-model.js'
import { TicketStatus } from '../models/ticket-model.js'

const { registerExecuteMock } = vi.hoisted(() => {
  return {
    registerExecuteMock: vi.fn()
  }
})

const mockListPurchases = vi.fn()
const mockListReservations = vi.fn()

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getRegisterCustomerUseCase: () => ({
      execute: registerExecuteMock
    })
  }
})

vi.mock('../services/customer-service.js', () => ({
  CustomerService: class {
    listPurchasesByAuthenticatedCustomer = mockListPurchases
    listReservationsByAuthenticatedCustomer = mockListReservations
  }
}))

import { customerRoutes } from './customer-controller.js'

describe('CustomerController', () => {
  const app = express()

  app.use(express.json())
  app.use((req: express.Request & { user?: { id: number; email: string } }, _res, next) => {
    req.user = { id: 10, email: 'customer@test.com' }
    next()
  })
  app.use('/customers', customerRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve registrar um customer com sucesso', async () => {
    const mockCustomer = {
      id: 1,
      userId: 10,
      name: 'Viviane',
      address: 'Rua Teste, 123',
      phone: '11999999999',
      createdAt: '2026-03-29T12:00:00.000Z'
    }

    registerExecuteMock.mockResolvedValue(mockCustomer)

    const response = await request(app).post('/customers/register').send({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      address: 'Rua Teste, 123',
      phone: '11999999999'
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockCustomer)

    expect(registerExecuteMock).toHaveBeenCalledWith({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      address: 'Rua Teste, 123',
      phone: '11999999999'
    })
  })

  test('deve listar purchases do customer autenticado', async () => {
    const purchaseDate = new Date('2026-06-15T00:00:00.000Z')
    const eventDate = new Date('2027-08-01T10:00:00.000Z')

    mockListPurchases.mockResolvedValue([
      {
        id: 1,
        status: PurchaseStatus.paid,
        total_amount: 200,
        purchase_date: purchaseDate,
        tickets: [
          {
            id: 3,
            location: 'A1',
            price: 100,
            status: TicketStatus.sold,
            event: {
              id: 1,
              name: 'Evento Final',
              date: eventDate,
              location: 'São Paulo'
            }
          }
        ]
      }
    ])

    const response = await request(app).get('/customers/purchases')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toMatchObject({
      id: 1,
      status: PurchaseStatus.paid,
      total_amount: 200,
      tickets: [
        {
          id: 3,
          location: 'A1',
          event: {
            id: 1,
            name: 'Evento Final',
            location: 'São Paulo'
          }
        }
      ]
    })
    expect(mockListPurchases).toHaveBeenCalledWith(10)
    expect(response.body[0]).not.toHaveProperty('password')
    expect(response.body[0]).not.toHaveProperty('customer_id')
  })

  test('deve listar reservations do customer autenticado', async () => {
    const reservationDate = new Date('2026-06-15T00:00:00.000Z')
    const expiresAt = new Date('2026-06-15T00:05:00.000Z')
    const eventDate = new Date('2027-08-01T10:00:00.000Z')

    mockListReservations.mockResolvedValue([
      {
        id: 1,
        status: ReservationStatus.reserved,
        reservation_date: reservationDate,
        expires_at: expiresAt,
        ticket: {
          id: 1,
          location: 'A1',
          price: 100,
          status: TicketStatus.reserved,
          event: {
            id: 1,
            name: 'Evento Final',
            date: eventDate,
            location: 'São Paulo'
          }
        }
      }
    ])

    const response = await request(app).get('/customers/reservations')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toMatchObject({
      id: 1,
      status: ReservationStatus.reserved,
      ticket: {
        id: 1,
        location: 'A1',
        event: {
          id: 1,
          name: 'Evento Final'
        }
      }
    })
    expect(mockListReservations).toHaveBeenCalledWith(10)
  })

  test('deve retornar 400 se usuário não for customer ao listar purchases', async () => {
    const { CustomerNotFoundError } = await import('../domain/errors/identity-errors.js')

    mockListPurchases.mockRejectedValue(new CustomerNotFoundError())

    const response = await request(app).get('/customers/purchases')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: 'User needs be a customer' })
  })

  test('deve retornar 400 se usuário não for customer ao listar reservations', async () => {
    const { CustomerNotFoundError } = await import('../domain/errors/identity-errors.js')

    mockListReservations.mockRejectedValue(new CustomerNotFoundError())

    const response = await request(app).get('/customers/reservations')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ message: 'User needs be a customer' })
  })

  test('deve retornar lista vazia de purchases quando não houver dados', async () => {
    mockListPurchases.mockResolvedValue([])

    const response = await request(app).get('/customers/purchases')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('deve retornar lista vazia de reservations quando não houver dados', async () => {
    mockListReservations.mockResolvedValue([])

    const response = await request(app).get('/customers/reservations')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('deve retornar 500 em erro inesperado ao listar purchases', async () => {
    mockListPurchases.mockRejectedValue(new Error('database down'))

    const response = await request(app).get('/customers/purchases')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ message: 'Internal server error' })
  })
})
