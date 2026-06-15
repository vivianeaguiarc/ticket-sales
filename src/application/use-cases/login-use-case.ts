import { InvalidCredentialsError } from '../../domain/errors/identity-errors.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'
import { TokenService } from '../../domain/services/token-service.js'

export interface LoginDependencies {
  userRepository: UserRepository
  tokenService: TokenService
}

export class LoginUseCase {
  constructor(private readonly dependencies: LoginDependencies) {}

  async execute(email: string, password: string): Promise<string> {
    const user = await this.dependencies.userRepository.findByEmail(email)

    if (!user || !this.dependencies.userRepository.comparePassword(password, user.passwordHash)) {
      throw new InvalidCredentialsError('Invalid email or password')
    }

    return this.dependencies.tokenService.sign({
      id: user.id,
      email: user.email
    })
  }
}
