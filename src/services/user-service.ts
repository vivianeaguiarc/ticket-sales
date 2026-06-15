import { getSharedUserRepository } from '../infra/composition/identity-factory.js'
import { toUserModel } from '../shared/mappers/user-mapper.js'

export class UserService {
  async findById(userId: number) {
    const user = await getSharedUserRepository().findById(userId)

    return user ? toUserModel(user) : null
  }

  async findByEmail(email: string) {
    const user = await getSharedUserRepository().findByEmail(email)

    return user ? toUserModel(user) : null
  }
}
