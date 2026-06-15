import { Partner } from '../../domain/entities/partner.js'
import { PartnerRepository } from '../../domain/repositories/partner-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { CreateUserData, UserRepository } from '../../domain/repositories/user-repository.js'

export interface RegisterPartnerInput {
  name: string
  email: string
  password: string
  company_name: string
}

export interface RegisterPartnerResult {
  id: number
  name: string
  userId: number
  company_name: string
  createdAt: Date
}

export interface RegisterPartnerDependencies {
  userRepository: UserRepository
  partnerRepository: PartnerRepository
  transactionManager: TransactionManager
}

export class RegisterPartnerUseCase {
  constructor(private readonly dependencies: RegisterPartnerDependencies) {}

  async execute(input: RegisterPartnerInput): Promise<RegisterPartnerResult> {
    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const userData: CreateUserData = {
        name: input.name,
        email: input.email,
        password: input.password
      }

      const user = await this.dependencies.userRepository.create(userData, { scope })

      const partner = await this.dependencies.partnerRepository.create(
        {
          userId: user.id,
          companyName: input.company_name
        },
        { scope }
      )

      return this.toResult(partner, input.name, user.id)
    })
  }

  private toResult(partner: Partner, name: string, userId: number): RegisterPartnerResult {
    return {
      id: partner.id,
      name,
      userId,
      company_name: partner.companyName,
      createdAt: partner.createdAt
    }
  }
}
