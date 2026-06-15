import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Partner } from '../../domain/entities/partner.js'
import { User } from '../../domain/entities/user.js'
import { UserAlreadyExistsError } from '../../domain/errors/identity-errors.js'
import { PartnerRepository } from '../../domain/repositories/partner-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'
import { RegisterPartnerUseCase } from './register-partner-use-case.js'

describe('Application RegisterPartnerUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }
  const createdAt = new Date('2026-03-29T10:00:00.000Z')

  const userRepository: UserRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    comparePassword: vi.fn()
  }

  const partnerRepository: PartnerRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findAll: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new RegisterPartnerUseCase({
    userRepository,
    partnerRepository,
    transactionManager
  })

  const input = {
    name: 'Viviane',
    email: 'viviane@email.com',
    password: '123456',
    company_name: 'Minha Empresa'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(userRepository.create).mockResolvedValue(
      new User(1, input.name, input.email, 'hash', createdAt)
    )
    vi.mocked(partnerRepository.create).mockResolvedValue(
      new Partner(10, 1, input.company_name, createdAt)
    )
  })

  it('deve registrar um partner com sucesso em transação', async () => {
    const result = await useCase.execute(input)

    expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1)
    expect(userRepository.create).toHaveBeenCalledWith(
      {
        name: input.name,
        email: input.email,
        password: input.password
      },
      { scope }
    )
    expect(partnerRepository.create).toHaveBeenCalledWith(
      {
        userId: 1,
        companyName: input.company_name
      },
      { scope }
    )
    expect(result).toEqual({
      id: 10,
      name: input.name,
      userId: 1,
      company_name: input.company_name,
      createdAt
    })
  })

  it('deve propagar UserAlreadyExistsError quando email já existir', async () => {
    vi.mocked(userRepository.create).mockRejectedValue(new UserAlreadyExistsError())

    await expect(useCase.execute(input)).rejects.toThrow(UserAlreadyExistsError)
    expect(partnerRepository.create).not.toHaveBeenCalled()
  })
})
