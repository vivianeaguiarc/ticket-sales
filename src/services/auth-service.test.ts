import { beforeEach, describe, expect, test, vi } from 'vitest'

const { loginExecuteMock } = vi.hoisted(() => {
  return {
    loginExecuteMock: vi.fn()
  }
})

vi.mock('../infra/composition/identity-factory.js', () => {
  return {
    getLoginUseCase: () => ({
      execute: loginExecuteMock
    })
  }
})

import { InvalidCredentialsError } from '../domain/errors/identity-errors.js'
import { AuthService } from './auth-service.js'

describe('AuthService', () => {
  const authService = new AuthService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    test('deve fazer login com sucesso', async () => {
      loginExecuteMock.mockResolvedValue('fake-jwt-token')

      const result = await authService.login('viviane@email.com', '123456')

      expect(loginExecuteMock).toHaveBeenCalledWith('viviane@email.com', '123456')
      expect(result).toBe('fake-jwt-token')
    })

    test('deve lançar erro se o usuário não existir', async () => {
      loginExecuteMock.mockRejectedValue(new InvalidCredentialsError('Invalid email or password'))

      await expect(authService.login('inexistente@email.com', '123456')).rejects.toThrow(
        InvalidCredentialsError
      )

      expect(loginExecuteMock).toHaveBeenCalledWith('inexistente@email.com', '123456')
    })

    test('deve lançar erro se a senha for inválida', async () => {
      loginExecuteMock.mockRejectedValue(new InvalidCredentialsError('Invalid email or password'))

      await expect(authService.login('viviane@email.com', 'senha-errada')).rejects.toThrow(
        InvalidCredentialsError
      )

      expect(loginExecuteMock).toHaveBeenCalledWith('viviane@email.com', 'senha-errada')
    })
  })
})
