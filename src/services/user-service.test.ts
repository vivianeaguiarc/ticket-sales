import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByIdMock, findByEmailMock } = vi.hoisted(() => {
  return {
    findByIdMock: vi.fn(),
    findByEmailMock: vi.fn()
  }
})

vi.mock('../models/user-model.js', () => {
  return {
    UserModel: {
      findById: findByIdMock,
      findByEmail: findByEmailMock
    }
  }
})

import { UserService } from './user-service.js'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    test('deve chamar UserModel.findById com o id correto', async () => {
      const fakeUser = { id: 1, name: 'Viviane' }

      findByIdMock.mockResolvedValue(fakeUser)

      const service = new UserService()

      const result = await service.findById(1)

      expect(findByIdMock).toHaveBeenCalledWith(1)
      expect(result).toBe(fakeUser)
    })

    test('deve retornar null quando user não existir', async () => {
      findByIdMock.mockResolvedValue(null)

      const service = new UserService()

      const result = await service.findById(999)

      expect(findByIdMock).toHaveBeenCalledWith(999)
      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    test('deve chamar UserModel.findByEmail com o email correto', async () => {
      const fakeUser = { id: 1, email: 'test@email.com' }

      findByEmailMock.mockResolvedValue(fakeUser)

      const service = new UserService()

      const result = await service.findByEmail('test@email.com')

      expect(findByEmailMock).toHaveBeenCalledWith('test@email.com')
      expect(result).toBe(fakeUser)
    })

    test('deve retornar null quando email não existir', async () => {
      findByEmailMock.mockResolvedValue(null)

      const service = new UserService()

      const result = await service.findByEmail('notfound@email.com')

      expect(findByEmailMock).toHaveBeenCalledWith('notfound@email.com')
      expect(result).toBeNull()
    })
  })
})
