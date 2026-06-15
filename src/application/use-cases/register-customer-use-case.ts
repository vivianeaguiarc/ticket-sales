import { Customer } from '../../domain/entities/customer.js'
import { CustomerRepository } from '../../domain/repositories/customer-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { CreateUserData, UserRepository } from '../../domain/repositories/user-repository.js'

export interface RegisterCustomerInput {
  name: string
  email: string
  password: string
  address: string
  phone: string
}

export interface RegisterCustomerResult {
  id: number
  userId: number
  name: string
  address: string
  phone: string
  createdAt: Date
}

export interface RegisterCustomerDependencies {
  userRepository: UserRepository
  customerRepository: CustomerRepository
  transactionManager: TransactionManager
}

export class RegisterCustomerUseCase {
  constructor(private readonly dependencies: RegisterCustomerDependencies) {}

  async execute(input: RegisterCustomerInput): Promise<RegisterCustomerResult> {
    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const userData: CreateUserData = {
        name: input.name,
        email: input.email,
        password: input.password
      }

      const user = await this.dependencies.userRepository.create(userData, { scope })

      const customer = await this.dependencies.customerRepository.create(
        {
          userId: user.id,
          address: input.address,
          phone: input.phone
        },
        { scope }
      )

      return this.toResult(customer, input.name, user.id)
    })
  }

  private toResult(customer: Customer, name: string, userId: number): RegisterCustomerResult {
    return {
      id: customer.id,
      userId,
      name,
      address: customer.address,
      phone: customer.phone,
      createdAt: customer.createdAt
    }
  }
}
