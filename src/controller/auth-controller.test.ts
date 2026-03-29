import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { loginMock } = vi.hoisted(() => {
  return {
    loginMock: vi.fn()
  }
})

vi.mock('../services/auth-service.js', () => {
  class InvalidCredentialsError extends Error {}

  return {
    AuthService: class {
      login = loginMock
    },
    InvalidCredentialsError
  }
})

import { InvalidCredentialsError } from '../services/auth-service.js'
import { authRoutes } from './auth-controller.js'

describe('AuthController', () => {
  const app = express()

  app.use(express.json())
  app.use('/auth', authRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  test('deve retornar token com sucesso', async () => {
    loginMock.mockResolvedValue('fake-jwt-token')

    const response = await request(app).post('/auth/login').send({
      email: 'test@email.com',
      password: '123456'
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      token: 'fake-jwt-token'
    })

    expect(loginMock).toHaveBeenCalledWith('test@email.com', '123456')
  })

  test('deve retornar 401 para credenciais inválidas', async () => {
    loginMock.mockRejectedValue(new InvalidCredentialsError('Invalid email or password'))

    const response = await request(app).post('/auth/login').send({
      email: 'wrong@email.com',
      password: 'wrong'
    })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'Invalid email or password'
    })

    expect(loginMock).toHaveBeenCalledWith('wrong@email.com', 'wrong')
  })

  test('deve retornar 401 para erro genérico', async () => {
    loginMock.mockRejectedValue(new Error('unexpected error'))

    const response = await request(app).post('/auth/login').send({
      email: 'test@email.com',
      password: '123456'
    })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'Invalid email or password'
    })
  })
})
