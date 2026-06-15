import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { registerExecuteMock } = vi.hoisted(() => {
  return {
    registerExecuteMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getRegisterCustomerUseCase: () => ({
      execute: registerExecuteMock
    })
  }
})

import { customerRoutes } from './customer-controller.js'

describe('CustomerController', () => {
  const app = express()

  app.use(express.json())
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
})
