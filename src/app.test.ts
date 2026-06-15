import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { verifyMock, findByIdMock } = vi.hoisted(() => {
  return {
    verifyMock: vi.fn(),
    findByIdMock: vi.fn()
  }
})

vi.mock('jsonwebtoken', () => {
  return {
    default: {
      verify: verifyMock
    }
  }
})

vi.mock('./services/user-service.js', () => {
  return {
    UserService: class {
      findById = findByIdMock
    }
  }
})

import { app } from './app.js'

describe('app routes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  test('deve retornar 401 na rota raiz sem token', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'No token provided'
    })
  })

  test('deve permitir acesso à rota /health sem token', async () => {
    const response = await request(app).get('/health')

    expect(response.status).not.toBe(401)
    expect(response.body).not.toEqual({
      message: 'No token provided'
    })
  })

  test('deve permitir acesso à rota /docs sem token', async () => {
    const response = await request(app).get('/docs/')

    expect(response.status).not.toBe(401)
    expect(response.body).not.toEqual({
      message: 'No token provided'
    })
  })

  test('deve permitir acesso à rota /ready sem token', async () => {
    const response = await request(app).get('/ready')

    expect(response.status).not.toBe(401)
    expect(response.body).not.toEqual({
      message: 'No token provided'
    })
  })

  test('deve permitir acesso à rota /auth/login sem token', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      password: 'testpassword'
    })

    expect(response.body).not.toEqual({
      message: 'No token provided'
    })
  })

  test('deve permitir acesso à rota pública GET /events sem token', async () => {
    const response = await request(app).get('/events')

    expect(response.status).not.toBe(401)
    expect(response.body).not.toEqual({
      message: 'No token provided'
    })
  })

  test('deve retornar 401 em rota protegida sem token', async () => {
    const response = await request(app).post('/customers').send({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: '123456',
      address: 'Rua Teste',
      phone: '99999-9999'
    })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'No token provided'
    })
  })

  test('deve retornar 401 quando o token for inválido', async () => {
    verifyMock.mockImplementation(() => {
      throw new Error('invalid token')
    })

    const response = await request(app).get('/').set('Authorization', 'Bearer invalid-token')

    expect(verifyMock).toHaveBeenCalledWith('invalid-token', 'your_secret_key')
    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'Failed to authenticate token'
    })
  })

  test('deve retornar 401 quando o usuário do token não for encontrado', async () => {
    verifyMock.mockReturnValue({
      id: 999,
      email: 'notfound@email.com'
    })

    findByIdMock.mockResolvedValue(null)

    const response = await request(app).get('/').set('Authorization', 'Bearer valid-token')

    expect(verifyMock).toHaveBeenCalledWith('valid-token', 'your_secret_key')
    expect(findByIdMock).toHaveBeenCalledWith(999)

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      message: 'User not found'
    })
  })

  test('deve permitir acesso à rota protegida com token válido e usuário existente', async () => {
    verifyMock.mockReturnValue({
      id: 1,
      email: 'viviane@email.com'
    })

    findByIdMock.mockResolvedValue({
      id: 1,
      email: 'viviane@email.com'
    })

    const response = await request(app).get('/').set('Authorization', 'Bearer valid-token')

    expect(verifyMock).toHaveBeenCalledWith('valid-token', 'your_secret_key')
    expect(findByIdMock).toHaveBeenCalledWith(1)

    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello World!')
  })
})
