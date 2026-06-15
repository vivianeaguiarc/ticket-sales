import { beforeEach, describe, expect, it, vi } from 'vitest'

import { User } from '../../domain/entities/user.js'
import { InvalidCredentialsError } from '../../domain/errors/identity-errors.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'
import { TokenService } from '../../domain/services/token-service.js'
import { LoginUseCase } from './login-use-case.js'

describe('Application LoginUseCase', () => {
  const userRepository: UserRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    comparePassword: vi.fn()
  }

  const tokenService: TokenService = {
    sign: vi.fn()
  }

  const useCase = new LoginUseCase({
    userRepository,
    tokenService
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve fazer login com sucesso', async () => {
    const user = new User(1, 'Viviane', 'viviane@email.com', 'hashed-password', new Date())

    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)
    vi.mocked(userRepository.comparePassword).mockReturnValue(true)
    vi.mocked(tokenService.sign).mockReturnValue('fake-jwt-token')

    const result = await useCase.execute('viviane@email.com', '123456')

    expect(userRepository.findByEmail).toHaveBeenCalledWith('viviane@email.com')
    expect(userRepository.comparePassword).toHaveBeenCalledWith('123456', 'hashed-password')
    expect(tokenService.sign).toHaveBeenCalledWith({ id: 1, email: 'viviane@email.com' })
    expect(result).toBe('fake-jwt-token')
  })

  it('deve lançar InvalidCredentialsError se o usuário não existir', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

    await expect(useCase.execute('inexistente@email.com', '123456')).rejects.toThrow(
      InvalidCredentialsError
    )

    expect(userRepository.comparePassword).not.toHaveBeenCalled()
    expect(tokenService.sign).not.toHaveBeenCalled()
  })

  it('deve lançar InvalidCredentialsError se a senha for inválida', async () => {
    const user = new User(1, 'Viviane', 'viviane@email.com', 'hashed-password', new Date())

    vi.mocked(userRepository.findByEmail).mockResolvedValue(user)
    vi.mocked(userRepository.comparePassword).mockReturnValue(false)

    await expect(useCase.execute('viviane@email.com', 'senha-errada')).rejects.toThrow(
      InvalidCredentialsError
    )

    expect(tokenService.sign).not.toHaveBeenCalled()
  })
})
