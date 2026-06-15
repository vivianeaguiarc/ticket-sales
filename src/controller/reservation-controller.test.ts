import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Reservation, ReservationStatus } from '../domain/entities/reservation.js'

const mockFindByUserId = vi.fn()
const mockExecute = vi.fn()

vi.mock('../services/customer-service.js', () => ({
  CustomerService: class {
    findByUserId = mockFindByUserId
  }
}))

vi.mock('../infra/composition/create-reservation-factory.js', () => ({
  getCreateReservationUseCase: () => ({
    execute: mockExecute
  })
}))

describe('ReservationController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeApp = async () => {
    const { reservationRoutes } = await import('./reservation-controller.js')

    const app = express()
    app.use(express.json())

    app.use(
      (
        req: express.Request & { user?: { id: number; email: string } },
        _res: express.Response,
        next: express.NextFunction
      ) => {
        req.user = { id: 1, email: 'test@test.com' }
        next()
      }
    )

    app.use('/partners/events/reservations', reservationRoutes)

    return app
  }

  it('should return 201 on success', async () => {
    mockFindByUserId.mockResolvedValue({ id: 1 })
    const reservationDate = new Date('2027-06-15T11:55:00.000Z')
    const expiresAt = new Date('2027-06-15T12:00:00.000Z')

    mockExecute.mockResolvedValue([
      new Reservation(1, 1, 1, reservationDate, expiresAt, ReservationStatus.reserved),
      new Reservation(2, 1, 2, reservationDate, expiresAt, ReservationStatus.reserved)
    ])

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [1, 2] })

    expect(response.status).toBe(201)
    expect(response.body).toEqual([
      {
        id: 1,
        customer_id: 1,
        ticket_id: 1,
        reservation_date: reservationDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: ReservationStatus.reserved
      },
      {
        id: 2,
        customer_id: 1,
        ticket_id: 2,
        reservation_date: reservationDate.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: ReservationStatus.reserved
      }
    ])
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockExecute).toHaveBeenCalledWith({
      customerId: 1,
      userId: 1,
      ticketIds: [1, 2]
    })
  })

  it('should return 400 if ticket_ids is empty', async () => {
    mockFindByUserId.mockResolvedValue({ id: 1 })

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [] })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'ticket_ids is required'
    })
  })

  it('should return 400 if user is not customer', async () => {
    mockFindByUserId.mockResolvedValue(null)

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [1] })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'User needs be a customer'
    })
  })

  it('should return 404 if ticket not found', async () => {
    mockFindByUserId.mockResolvedValue({ id: 1 })
    mockExecute.mockRejectedValue(new Error('Some tickets not found'))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [999] })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Some tickets not found'
    })
  })

  it('should return 409 if ticket is not available', async () => {
    mockFindByUserId.mockResolvedValue({ id: 1 })
    mockExecute.mockRejectedValue(new Error('Ticket 1 is not available'))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/reservations')
      .send({ ticket_ids: [1] })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      message: 'Ticket 1 is not available'
    })
  })
})
