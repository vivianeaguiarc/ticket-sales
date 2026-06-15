import { User } from '../../domain/entities/user.js'
import { UserModel } from '../../models/user-model.js'

export function toUserModel(user: User): UserModel {
  return new UserModel({
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.passwordHash,
    created_at: user.createdAt
  })
}
