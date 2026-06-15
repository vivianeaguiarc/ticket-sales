import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByIdMock, findByEmailMock } = vi.hoisted(() => {
  return {
    findByIdMock: vi.fn(),
    findByEmailMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getSharedUserRepository: () => ({
      findById: findByIdMock,
      findByEmail: findByEmailMock
    })
  }
})

import { User } from '../domain/entities/user.js'
import { UserService } from './user-service.js'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    test('deve chamar UserRepository.findById com o id correto', async () => {
      const createdAt = new Date()
      const domainUser = new User(1, 'Viviane', 'viviane@email.com', 'hash', createdAt)

      findByIdMock.mockResolvedValue(domainUser)

      const service = new UserService()

      const result = await service.findById(1)

      expect(findByIdMock).toHaveBeenCalledWith(1)
      expect(result).toMatchObject({
        id: 1,
        name: 'Viviane',
        email: 'viviane@email.com'
      })
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
    test('deve chamar UserRepository.findByEmail com o email correto', async () => {
      const createdAt = new Date()
      const domainUser = new User(1, 'Test', 'test@email.com', 'hash', createdAt)

      findByEmailMock.mockResolvedValue(domainUser)

      const service = new UserService()

      const result = await service.findByEmail('test@email.com')

      expect(findByEmailMock).toHaveBeenCalledWith('test@email.com')
      expect(result).toMatchObject({
        id: 1,
        email: 'test@email.com'
      })
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
