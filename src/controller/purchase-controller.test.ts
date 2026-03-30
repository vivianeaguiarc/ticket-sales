import express, { NextFunction, Request, Response } from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByUserIdMock, createPurchaseMock, findPurchaseByIdMock, cancelPurchaseMock } =
  vi.hoisted(() => {
    return {
      findByUserIdMock: vi.fn(),
      createPurchaseMock: vi.fn(),
      findPurchaseByIdMock: vi.fn(),
      cancelPurchaseMock: vi.fn()
    }
  })

vi.mock('../services/customer-service', () => {
  class CustomerService {
    findByUserId = findByUserIdMock
  }

  return {
    CustomerService
  }
})

vi.mock('../services/payment-service', () => {
  class PaymentService {}

  return {
    PaymentService
  }
})

vi.mock('../services/purchase-service', () => {
  class PurchaseService {
    create = createPurchaseMock
    findById = findPurchaseByIdMock
    cancel = cancelPurchaseMock
  }

  return {
    PurchaseService
  }
})

import { purchaseRoutes } from './purchase-controller.js'

describe('purchaseRoutes', () => {
  let app: express.Express

  beforeEach(() => {
    vi.clearAllMocks()

    app = express()
    app.use(express.json())

    app.use((req: Request & { user?: { id: number } }, _res: Response, next: NextFunction) => {
      req.user = { id: 1 }
      next()
    })

    app.use('/purchases', purchaseRoutes)
  })

  test('deve retornar 400 quando usuário não for customer', async () => {
    findByUserIdMock.mockResolvedValue(null)

    const response = await request(app)
      .post('/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'valid_token_123'
      })

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      message: 'User needs be a customer'
    })

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createPurchaseMock).not.toHaveBeenCalled()
    expect(findPurchaseByIdMock).not.toHaveBeenCalled()
  })

  test('deve criar uma compra com sucesso e retornar 201', async () => {
    const customer = {
      id: 10,
      user_id: 1,
      address: 'Rua A',
      phone: '11999999999'
    }

    const purchase = {
      id: 99,
      customer_id: 10,
      total_amount: 250,
      status: 'paid'
    }

    findByUserIdMock.mockResolvedValue(customer)
    createPurchaseMock.mockResolvedValue(99)
    findPurchaseByIdMock.mockResolvedValue(purchase)

    const response = await request(app)
      .post('/purchases')
      .send({
        ticket_ids: [1, 2],
        card_token: 'valid_token_123'
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(purchase)

    expect(findByUserIdMock).toHaveBeenCalledWith(1)
    expect(createPurchaseMock).toHaveBeenCalledWith({
      customerId: 10,
      ticketIds: [1, 2],
      cardToken: 'valid_token_123'
    })
    expect(findPurchaseByIdMock).toHaveBeenCalledWith(99)
  })

  test('deve cancelar uma compra com sucesso e retornar 200', async () => {
    cancelPurchaseMock.mockResolvedValue(undefined)

    const response = await request(app).post('/purchases/99/cancel').send()

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Purchase cancelled successfully'
    })

    expect(cancelPurchaseMock).toHaveBeenCalledWith(99)
  })
})
