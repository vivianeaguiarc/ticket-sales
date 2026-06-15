import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Event } from '../domain/entities/event.js'

const findAllExecuteMock = vi.fn()
const findByIdExecuteMock = vi.fn()

vi.mock('../infra/composition/event-factory.js', () => ({
  getGetEventsUseCase: () => ({
    execute: findAllExecuteMock
  }),
  getGetEventByIdUseCase: () => ({
    execute: findByIdExecuteMock
  })
}))

import { eventsRoutes } from './event-controller.js'

describe('EventController', () => {
  const app = express()

  app.use(express.json())
  app.use('/events', eventsRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve listar todos os eventos com sucesso', async () => {
    const createdAt = new Date('2027-06-15T12:00:00.000Z')

    findAllExecuteMock.mockResolvedValue([
      new Event(1, 10, 'Evento 1', null, new Date(), 'São Paulo', createdAt),
      new Event(2, 10, 'Evento 2', null, new Date(), 'Rio de Janeiro', createdAt)
    ])

    const response = await request(app).get('/events')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(2)
    expect(findAllExecuteMock).toHaveBeenCalledTimes(1)
  })

  test('deve retornar um evento por id com sucesso', async () => {
    const createdAt = new Date('2027-06-15T12:00:00.000Z')

    findByIdExecuteMock.mockResolvedValue(
      new Event(1, 10, 'Evento Teste', null, new Date(), 'São Paulo', createdAt)
    )

    const response = await request(app).get('/events/1')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: 1,
      name: 'Evento Teste',
      location: 'São Paulo'
    })
    expect(findByIdExecuteMock).toHaveBeenCalledWith({ eventId: 1 })
  })

  test('deve retornar 404 quando o evento não for encontrado', async () => {
    findByIdExecuteMock.mockResolvedValue(null)

    const response = await request(app).get('/events/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })
    expect(findByIdExecuteMock).toHaveBeenCalledWith({ eventId: 999 })
  })
})
