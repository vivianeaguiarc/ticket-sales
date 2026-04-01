import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindByUserId = vi.fn()
const mockCreatePurchaseExecute = vi.fn()
const mockCancel = vi.fn()

vi.mock('../services/customer-service.js', () => ({
  CustomerService: class {
    findByUserId = mockFindByUserId
  }
}))

vi.mock('../use-cases/create-purchase-use-case.js', () => ({
  CreatePurchaseUseCase: {
    execute: mockCreatePurchaseExecute
  }
}))

vi.mock('../services/payment-service.js', () => ({
  PaymentService: class {}
}))

vi.mock('../services/purchase-service.js', () => ({
  PurchaseService: class {
    cancel = mockCancel
  }
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
    mockCreatePurchaseExecute.mockResolvedValue({ id: 1 })

    const app = await makeApp()

    const response = await request(app)
      .post('/partners/events/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'card_token_test'
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: 1 })
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockCreatePurchaseExecute).toHaveBeenCalledWith({
      customer_id: 10,
      ticket_ids: [1, 2]
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
    mockCreatePurchaseExecute.mockRejectedValue(new Error('Internal error'))

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
    mockCancel.mockResolvedValue(undefined)

    const app = await makeApp()

    const response = await request(app).post('/partners/events/purchases/1/cancel').send()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Purchase cancelled successfully'
    })
    expect(mockCancel).toHaveBeenCalledWith(1)
  })
})
