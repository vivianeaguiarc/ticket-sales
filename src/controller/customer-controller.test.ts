import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { registerMock } = vi.hoisted(() => {
  return {
    registerMock: vi.fn()
  }
})

vi.mock('../services/customer-service.js', () => {
  return {
    CustomerService: class {
      register = registerMock
    }
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

    registerMock.mockResolvedValue(mockCustomer)

    const response = await request(app).post('/customers/register').send({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      address: 'Rua Teste, 123',
      phone: '11999999999'
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(mockCustomer)

    expect(registerMock).toHaveBeenCalledWith({
      name: 'Viviane',
      email: 'viviane@email.com',
      password: '123456',
      address: 'Rua Teste, 123',
      phone: '11999999999'
    })
  })
})
