import { User } from '../../domain/entities/user.js'
import { UserAlreadyExistsError } from '../../domain/errors/identity-errors.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { CreateUserData, UserRepository } from '../../domain/repositories/user-repository.js'
import { UserModel } from '../../models/user-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'ER_DUP_ENTRY'
  )
}

function toDomainUser(model: UserModel): User {
  return new User(model.id, model.name, model.email, model.password, model.created_at)
}

export class MysqlUserRepository implements UserRepository {
  async create(data: CreateUserData, options?: RepositoryQueryOptions): Promise<User> {
    const connection = resolveMysqlConnection(options?.scope)

    try {
      const user = await UserModel.create(
        {
          name: data.name,
          email: data.email,
          password: data.password
        },
        { connection }
      )

      return toDomainUser(user)
    } catch (error) {
      if (isDuplicateEntryError(error)) {
        throw new UserAlreadyExistsError()
      }

      throw error
    }
  }

  async findById(id: number, _options?: RepositoryQueryOptions): Promise<User | null> {
    const user = await UserModel.findById(id)

    return user ? toDomainUser(user) : null
  }

  async findByEmail(email: string, _options?: RepositoryQueryOptions): Promise<User | null> {
    const user = await UserModel.findByEmail(email)

    return user ? toDomainUser(user) : null
  }

  comparePassword(plainPassword: string, passwordHash: string): boolean {
    return UserModel.comparePassword(plainPassword, passwordHash)
  }
}
