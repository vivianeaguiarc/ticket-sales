import { beforeEach, describe, expect, it, vi } from 'vitest'

import { User } from '../../domain/entities/user.js'
import { UserNotFoundError } from '../../domain/errors/identity-errors.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'
import { GetCurrentUserUseCase } from './get-current-user-use-case.js'

describe('Application GetCurrentUserUseCase', () => {
  const userRepository: UserRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    comparePassword: vi.fn()
  }

  const useCase = new GetCurrentUserUseCase({ userRepository })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar o usuário quando existir', async () => {
    const user = new User(1, 'Viviane', 'viviane@email.com', 'hash', new Date())

    vi.mocked(userRepository.findById).mockResolvedValue(user)

    const result = await useCase.execute(1)

    expect(userRepository.findById).toHaveBeenCalledWith(1)
    expect(result).toBe(user)
  })

  it('deve lançar UserNotFoundError quando usuário não existir', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute(999)).rejects.toThrow(UserNotFoundError)
  })
})
