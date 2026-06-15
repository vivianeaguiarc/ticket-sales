import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Customer } from '../../domain/entities/customer.js'
import { User } from '../../domain/entities/user.js'
import { UserAlreadyExistsError } from '../../domain/errors/identity-errors.js'
import { CustomerRepository } from '../../domain/repositories/customer-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'
import { RegisterCustomerUseCase } from './register-customer-use-case.js'

describe('Application RegisterCustomerUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }
  const createdAt = new Date('2026-03-29T12:00:00.000Z')

  const userRepository: UserRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    comparePassword: vi.fn()
  }

  const customerRepository: CustomerRepository = {
    create: vi.fn(),
    findByUserId: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new RegisterCustomerUseCase({
    userRepository,
    customerRepository,
    transactionManager
  })

  const input = {
    name: 'Viviane',
    email: 'viviane@email.com',
    password: '123456',
    address: 'Rua Teste, 123',
    phone: '11999999999'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(userRepository.create).mockResolvedValue(
      new User(1, input.name, input.email, 'hash', createdAt)
    )
    vi.mocked(customerRepository.create).mockResolvedValue(
      new Customer(10, 1, input.address, input.phone, createdAt)
    )
  })

  it('deve registrar um customer com sucesso em transação', async () => {
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
    expect(customerRepository.create).toHaveBeenCalledWith(
      {
        userId: 1,
        address: input.address,
        phone: input.phone
      },
      { scope }
    )
    expect(result).toEqual({
      id: 10,
      userId: 1,
      name: input.name,
      address: input.address,
      phone: input.phone,
      createdAt
    })
  })

  it('deve propagar UserAlreadyExistsError quando email já existir', async () => {
    vi.mocked(userRepository.create).mockRejectedValue(new UserAlreadyExistsError())

    await expect(useCase.execute(input)).rejects.toThrow(UserAlreadyExistsError)
    expect(customerRepository.create).not.toHaveBeenCalled()
  })
})
