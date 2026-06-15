import { User } from '../../domain/entities/user.js'
import { UserNotFoundError } from '../../domain/errors/identity-errors.js'
import { UserRepository } from '../../domain/repositories/user-repository.js'

export interface GetCurrentUserDependencies {
  userRepository: UserRepository
}

export class GetCurrentUserUseCase {
  constructor(private readonly dependencies: GetCurrentUserDependencies) {}

  async execute(userId: number): Promise<User> {
    const user = await this.dependencies.userRepository.findById(userId)

    if (!user) {
      throw new UserNotFoundError()
    }

    return user
  }
}
