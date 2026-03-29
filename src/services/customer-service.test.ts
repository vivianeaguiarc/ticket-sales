import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  getConnectionMock,
  userCreateMock,
  customerCreateMock
} = vi.hoisted(() => {
  return {
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    getConnectionMock: vi.fn(),
    userCreateMock: vi.fn(),
    customerCreateMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: vi.fn(() => ({
        getConnection: getConnectionMock
      }))
    }
  }
})

vi.mock('../models/user-model.js', () => {
  return {
    UserModel: {
      create: userCreateMock
    }
  }
})

vi.mock('../models/customer-model.js', () => {
  return {
    CustomerModel: {
      create: customerCreateMock
    }
  }
})

import { CustomerService } from './customer-service.js'

describe('CustomerService', () => {
  const customerService = new CustomerService()

  beforeEach(() => {
    vi.clearAllMocks()

    getConnectionMock.mockResolvedValue({
      beginTransaction: beginTransactionMock,
      commit: commitMock,
      rollback: rollbackMock,
      release: releaseMock
    })
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

      const mockUser = {
        id: 1
      }

      const mockCustomer = {
        id: 10,
        created_at: new Date()
      }

      userCreateMock.mockResolvedValue(mockUser)
      customerCreateMock.mockResolvedValue(mockCustomer)

      const result = await customerService.register(input)

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)

      expect(userCreateMock).toHaveBeenCalledWith(
        {
          name: input.name,
          email: input.email,
          password: input.password
        },
        {
          connection: {
            beginTransaction: beginTransactionMock,
            commit: commitMock,
            rollback: rollbackMock,
            release: releaseMock
          }
        }
      )

      expect(customerCreateMock).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          address: input.address,
          phone: input.phone
        },
        {
          connection: {
            beginTransaction: beginTransactionMock,
            commit: commitMock,
            rollback: rollbackMock,
            release: releaseMock
          }
        }
      )

      expect(commitMock).toHaveBeenCalledTimes(1)
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalledTimes(1)

      expect(result).toEqual({
        id: mockCustomer.id,
        userId: mockUser.id,
        name: input.name,
        address: input.address,
        phone: input.phone,
        createdAt: mockCustomer.created_at
      })
    })

    test('deve fazer rollback se UserModel.create lançar erro', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        address: 'Rua Teste, 123',
        phone: '11999999999'
      }

      const error = new Error('User create error')

      userCreateMock.mockRejectedValue(error)

      await expect(customerService.register(input)).rejects.toThrow('User create error')

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)
      expect(userCreateMock).toHaveBeenCalledTimes(1)
      expect(customerCreateMock).not.toHaveBeenCalled()
      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })

    test('deve fazer rollback se CustomerModel.create lançar erro', async () => {
      const input = {
        name: 'Viviane',
        email: 'viviane@email.com',
        password: '123456',
        address: 'Rua Teste, 123',
        phone: '11999999999'
      }

      const mockUser = {
        id: 1
      }

      const error = new Error('Customer create error')

      userCreateMock.mockResolvedValue(mockUser)
      customerCreateMock.mockRejectedValue(error)

      await expect(customerService.register(input)).rejects.toThrow('Customer create error')

      expect(beginTransactionMock).toHaveBeenCalledTimes(1)

      expect(userCreateMock).toHaveBeenCalledWith(
        {
          name: input.name,
          email: input.email,
          password: input.password
        },
        {
          connection: {
            beginTransaction: beginTransactionMock,
            commit: commitMock,
            rollback: rollbackMock,
            release: releaseMock
          }
        }
      )

      expect(customerCreateMock).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          address: input.address,
          phone: input.phone
        },
        {
          connection: {
            beginTransaction: beginTransactionMock,
            commit: commitMock,
            rollback: rollbackMock,
            release: releaseMock
          }
        }
      )

      expect(commitMock).not.toHaveBeenCalled()
      expect(rollbackMock).toHaveBeenCalledTimes(1)
      expect(releaseMock).toHaveBeenCalledTimes(1)
    })
  })
})
