import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'signed-jwt-token')
  }
}))

import jwt from 'jsonwebtoken'

import { env } from '../../config/env.js'
import { JwtTokenService } from './jwt-token-service.js'

describe('JwtTokenService', () => {
  const tokenService = new JwtTokenService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve assinar payload com secret e expiração configurados', () => {
    const token = tokenService.sign({ id: 42, email: 'user@test.com' })

    expect(jwt.sign).toHaveBeenCalledWith({ id: 42, email: 'user@test.com' }, env.jwtSecret, {
      expiresIn: '1h'
    })
    expect(token).toBe('signed-jwt-token')
  })
})
