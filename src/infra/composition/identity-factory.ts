import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user-use-case.js'
import { LoginUseCase } from '../../application/use-cases/login-use-case.js'
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer-use-case.js'
import { RegisterPartnerUseCase } from '../../application/use-cases/register-partner-use-case.js'
import { MysqlTransactionManager } from '../database/mysql-transaction-manager.js'
import { MysqlCustomerRepository } from '../repositories/mysql-customer-repository.js'
import { MysqlPartnerRepository } from '../repositories/mysql-partner-repository.js'
import { MysqlUserRepository } from '../repositories/mysql-user-repository.js'
import { JwtTokenService } from '../services/jwt-token-service.js'

let sharedUserRepository: MysqlUserRepository | null = null
let sharedPartnerRepository: MysqlPartnerRepository | null = null
let sharedCustomerRepository: MysqlCustomerRepository | null = null
let loginUseCase: LoginUseCase | null = null
let getCurrentUserUseCase: GetCurrentUserUseCase | null = null
let registerPartnerUseCase: RegisterPartnerUseCase | null = null
let registerCustomerUseCase: RegisterCustomerUseCase | null = null

export function getSharedUserRepository(): MysqlUserRepository {
  if (!sharedUserRepository) {
    sharedUserRepository = new MysqlUserRepository()
  }

  return sharedUserRepository
}

export function getSharedPartnerRepository(): MysqlPartnerRepository {
  if (!sharedPartnerRepository) {
    sharedPartnerRepository = new MysqlPartnerRepository()
  }

  return sharedPartnerRepository
}

export function getSharedCustomerRepository(): MysqlCustomerRepository {
  if (!sharedCustomerRepository) {
    sharedCustomerRepository = new MysqlCustomerRepository()
  }

  return sharedCustomerRepository
}

export function getLoginUseCase(): LoginUseCase {
  if (!loginUseCase) {
    loginUseCase = new LoginUseCase({
      userRepository: getSharedUserRepository(),
      tokenService: new JwtTokenService()
    })
  }

  return loginUseCase
}

export function getGetCurrentUserUseCase(): GetCurrentUserUseCase {
  if (!getCurrentUserUseCase) {
    getCurrentUserUseCase = new GetCurrentUserUseCase({
      userRepository: getSharedUserRepository()
    })
  }

  return getCurrentUserUseCase
}

export function getRegisterPartnerUseCase(): RegisterPartnerUseCase {
  if (!registerPartnerUseCase) {
    registerPartnerUseCase = new RegisterPartnerUseCase({
      userRepository: getSharedUserRepository(),
      partnerRepository: getSharedPartnerRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return registerPartnerUseCase
}

export function getRegisterCustomerUseCase(): RegisterCustomerUseCase {
  if (!registerCustomerUseCase) {
    registerCustomerUseCase = new RegisterCustomerUseCase({
      userRepository: getSharedUserRepository(),
      customerRepository: getSharedCustomerRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return registerCustomerUseCase
}

export function resetIdentityUseCasesForTests(): void {
  sharedUserRepository = null
  sharedPartnerRepository = null
  sharedCustomerRepository = null
  loginUseCase = null
  getCurrentUserUseCase = null
  registerPartnerUseCase = null
  registerCustomerUseCase = null
}
