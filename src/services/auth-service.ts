import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'
import { UserModel } from '../models/user-model.js'

export class AuthService {
  async login(email: string, password: string) {
    const userModel = await UserModel.findByEmail(email)
    if (userModel && bcrypt.compareSync(password, userModel.password)) {
      return jwt.sign({ id: userModel.id, email: userModel.email }, env.jwtSecret, {
        expiresIn: '1h'
      })
    } else {
      throw new InvalidCredentialsError('Invalid email or password')
    }
  }
}
export class InvalidCredentialsError extends Error {}
