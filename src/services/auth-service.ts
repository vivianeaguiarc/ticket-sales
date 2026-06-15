import { getLoginUseCase } from '../infra/composition/identity-factory.js'

export { InvalidCredentialsError } from '../domain/errors/identity-errors.js'

export class AuthService {
  async login(email: string, password: string) {
    return getLoginUseCase().execute(email, password)
  }
}
