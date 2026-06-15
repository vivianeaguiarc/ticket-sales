import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Purchase, PurchaseStatus } from '../domain/entities/purchase.js'

const mockFindByUserId = vi.fn()
const mockCreateExecute = vi.fn()
const mockCancelExecute = vi.fn()

vi.mock('../services/customer-service.js', () => ({
  CustomerService: class {
    findByUserId = mockFindByUserId
  }
}))

vi.mock('../infra/composition/purchase-factory.js', () => ({
  getCreatePurchaseUseCase: () => ({
    execute: mockCreateExecute
  }),
  getCancelPurchaseUseCase: () => ({
    execute: mockCancelExecute
  })
}))

describe('purchaseRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeApp = async () => {
    const { purchaseRoutes } = await import('./purchase-controller.js')

    const app = express()
    app.use(express.json())

    app.use((req: express.Request & { user?: { id: number; email: string } }, _res, next) => {
      req.user = { id: 1, email: 'test@test.com' }
      next()
    })

    app.use('/partners/events/purchases', purchaseRoutes)

    return app
  }

  it('should create purchase successfully', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })
    const purchaseDate = new Date('2027-06-15T12:00:00.000Z')

    mockCreateExecute.mockResolvedValue(new Purchase(1, 10, purchaseDate, 200, PurchaseStatus.paid))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'card_token_test'
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      id: 1,
      customer_id: 10,
      total_amount: 200,
      status: PurchaseStatus.paid
    })
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockCreateExecute).toHaveBeenCalledWith({
      customerId: 10,
      userId: 1,
      ticketIds: [1, 2]
    })
  })

  it('should return 400 if ticket_ids is missing', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })

    const app = await makeApp()

    const response = await request(app).post('/partners/events/purchases').send({
      card_token: 'card_token_test'
    })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'ticket_ids is required'
    })
  })

  it('should return 400 if card_token is missing', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1, 2]
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'card_token is required'
    })
  })

  it('should return 500 if use case throws', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })
    mockCreateExecute.mockRejectedValue(new Error('Internal error'))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'card_token_test'
      })

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      message: 'Internal server error'
    })
  })

  it('should cancel purchase successfully', async () => {
    mockCancelExecute.mockResolvedValue(undefined)

    const app = await makeApp()

    const response = await request(app).post('/partners/events/purchases/1/cancel').send()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Purchase cancelled successfully'
    })
    expect(mockCancelExecute).toHaveBeenCalledWith({
      purchaseId: 1,
      userId: 1
    })
  })

  it('should return 404 when purchase is not found', async () => {
    mockCancelExecute.mockRejectedValue(new Error('Purchase not found'))

    const app = await makeApp()

    const response = await request(app).post('/partners/events/purchases/999/cancel').send()

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Purchase not found' })
  })

  it('should return 409 when purchase is already cancelled', async () => {
    mockCancelExecute.mockRejectedValue(new Error('Purchase already cancelled'))

    const app = await makeApp()

    const response = await request(app).post('/partners/events/purchases/1/cancel').send()

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: 'Purchase already cancelled' })
  })

  it('should return 404 when tickets are not found', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })
    mockCreateExecute.mockRejectedValue(new Error('Some tickets not found'))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'card_token_test'
      })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Some tickets not found' })
  })

  it('should return 409 when ticket is not available', async () => {
    mockFindByUserId.mockResolvedValue({ id: 10 })
    mockCreateExecute.mockRejectedValue(new Error('Ticket 1 is not available'))

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1],
        card_token: 'card_token_test'
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ message: 'Ticket 1 is not available' })
  })
})
