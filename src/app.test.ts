import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { app } from './app.js'

describe('app routes', () => {
  test('deve retornar Hello World na rota raiz', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.text).toBe('Hello World!')
  })

  test('deve retornar Login successful em /auth/login', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'testuser@example.com',
      password: 'testpassword'
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'Login successful'
    })
  })

  test('deve retornar 501 em /customers', async () => {
    const response = await request(app).post('/customers').send({
      name: 'Test Customer',
      email: 'customer@example.com',
      password: '123456',
      address: 'Rua Teste',
      phone: '99999-9999'
    })

    expect(response.status).toBe(501)
    expect(response.body).toEqual({
      message: 'Route not implemented yet'
    })
  })
})
