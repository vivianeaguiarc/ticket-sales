import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByEmailMock, compareSyncMock, signMock } = vi.hoisted(() => {
  return {
    findByEmailMock: vi.fn(),
    compareSyncMock: vi.fn(),
    signMock: vi.fn()
  }
})

vi.mock('../models/user-model.js', () => {
  return {
    UserModel: {
      findByEmail: findByEmailMock
    }
  }
})

vi.mock('bcrypt', () => {
  return {
    default: {
      compareSync: compareSyncMock
    }
  }
})

vi.mock('jsonwebtoken', () => {
  return {
    default: {
      sign: signMock
    }
  }
})

import { UserModel } from '../models/user-model.js'
import { AuthService, InvalidCredentialsError } from './auth-service.js'

describe('AuthService', () => {
  const authService = new AuthService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    test('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: 1,
        email: 'viviane@email.com',
        password: 'hashed-password'
      }

      findByEmailMock.mockResolvedValue(mockUser)
      compareSyncMock.mockReturnValue(true)
      signMock.mockReturnValue('fake-jwt-token')

      const result = await authService.login('viviane@email.com', '123456')

      expect(UserModel.findByEmail).toHaveBeenCalledWith('viviane@email.com')
      expect(compareSyncMock).toHaveBeenCalledWith('123456', mockUser.password)
      expect(signMock).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email },
        'your_secret_key',
        { expiresIn: '1h' }
      )

      expect(result).toBe('fake-jwt-token')
    })

    test('deve lançar erro se o usuário não existir', async () => {
      findByEmailMock.mockResolvedValue(null)

      await expect(authService.login('inexistente@email.com', '123456')).rejects.toThrow(
        InvalidCredentialsError
      )

      expect(UserModel.findByEmail).toHaveBeenCalledWith('inexistente@email.com')
      expect(compareSyncMock).not.toHaveBeenCalled()
      expect(signMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro se a senha for inválida', async () => {
      const mockUser = {
        id: 1,
        email: 'viviane@email.com',
        password: 'hashed-password'
      }

      findByEmailMock.mockResolvedValue(mockUser)
      compareSyncMock.mockReturnValue(false)

      await expect(authService.login('viviane@email.com', 'senha-errada')).rejects.toThrow(
        InvalidCredentialsError
      )

      expect(UserModel.findByEmail).toHaveBeenCalledWith('viviane@email.com')
      expect(compareSyncMock).toHaveBeenCalledWith('senha-errada', mockUser.password)
      expect(signMock).not.toHaveBeenCalled()
    })
  })
})
