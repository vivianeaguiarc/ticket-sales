import { beforeEach, describe, expect, test, vi } from 'vitest'

const { registerExecuteMock, findByUserIdMock } = vi.hoisted(() => {
  return {
    registerExecuteMock: vi.fn(),
    findByUserIdMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getRegisterCustomerUseCase: () => ({
      execute: registerExecuteMock
    }),
    getSharedCustomerRepository: () => ({
      findByUserId: findByUserIdMock
    })
  }
})

import { Customer } from '../domain/entities/customer.js'
import { CustomerService } from './customer-service.js'

describe('CustomerService', () => {
  const customerService = new CustomerService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    test('deve registrar um customer com sucesso', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        address: 'Rua Teste, 123',
        phone: '11999999999'
      }

      const createdAt = new Date()

      registerExecuteMock.mockResolvedValue({
        id: 10,
        userId: 1,
        name: input.name,
        address: input.address,
        phone: input.phone,
        createdAt
      })

      const result = await customerService.register(input)

      expect(registerExecuteMock).toHaveBeenCalledWith(input)
      expect(result).toEqual({
        id: 10,
        userId: 1,
        name: input.name,
        address: input.address,
        phone: input.phone,
        createdAt
      })
    })

    test('deve propagar erro do use case', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        address: 'Rua Teste, 123',
        phone: '11999999999'
      }

      registerExecuteMock.mockRejectedValue(new Error('User create error'))

      await expect(customerService.register(input)).rejects.toThrow('User create error')
    })
  })

  describe('findByUserId', () => {
    test('deve buscar customer por userId', async () => {
      const createdAt = new Date()
      const domainCustomer = new Customer(5, 2, 'Rua A', '111', createdAt)

      findByUserIdMock.mockResolvedValue(domainCustomer)

      const result = await customerService.findByUserId(2)

      expect(findByUserIdMock).toHaveBeenCalledWith(2)
      expect(result).toMatchObject({
        id: 5,
        user_id: 2
      })
    })
  })
})
