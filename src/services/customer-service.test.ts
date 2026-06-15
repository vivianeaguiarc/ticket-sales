import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByUserIdMock } = vi.hoisted(() => {
  return {
    findByUserIdMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
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
