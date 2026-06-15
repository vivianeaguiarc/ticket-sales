import jwt from 'jsonwebtoken'

import { env } from '../../config/env.js'
import { JwtPayload, TokenService } from '../../domain/services/token-service.js'

export class JwtTokenService implements TokenService {
  sign(payload: JwtPayload): string {
    return jwt.sign({ id: payload.id, email: payload.email }, env.jwtSecret, {
      expiresIn: '1h'
    })
  }
}
