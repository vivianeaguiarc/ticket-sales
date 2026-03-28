import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user-model.js'

export class AuthService {
  async login(email: string, password: string) {
      const userModel = await UserModel.findByEmail(email)
      if (userModel && bcrypt.compareSync(password, userModel.password)) {
        return jwt.sign({ id: userModel.id, email: userModel.email }, 'your_secret_key', {
          expiresIn: '1h'
        })
      } else {
        throw new InvalidCredentialsError('Invalid email or password')
      }
  }
}
export class InvalidCredentialsError extends Error {}
