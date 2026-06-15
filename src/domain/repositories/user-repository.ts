import { User } from '../entities/user.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreateUserData {
  name: string
  email: string
  password: string
}

export interface UserRepository {
  create(data: CreateUserData, options?: RepositoryQueryOptions): Promise<User>
  findById(id: number, options?: RepositoryQueryOptions): Promise<User | null>
  findByEmail(email: string, options?: RepositoryQueryOptions): Promise<User | null>
  comparePassword(plainPassword: string, passwordHash: string): boolean
}
