import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const findAllMock = vi.fn()
const findByIdMock = vi.fn()

vi.mock('../services/event-service.js', () => {
  return {
    EventService: class {
      findAll = findAllMock
      findById = findByIdMock
    }
  }
})

import { eventsRoutes } from './event-controller.js'

describe('EventController', () => {
  const app = express()

  app.use(express.json())
  app.use('/events', eventsRoutes)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('deve listar todos os eventos com sucesso', async () => {
    const mockEvents = [
      {
        id: 1,
        name: 'Evento 1',
        location: 'São Paulo'
      },
      {
        id: 2,
        name: 'Evento 2',
        location: 'Rio de Janeiro'
      }
    ]

    findAllMock.mockResolvedValue(mockEvents)

    const response = await request(app).get('/events')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockEvents)
    expect(findAllMock).toHaveBeenCalledTimes(1)
  })

  test('deve retornar um evento por id com sucesso', async () => {
    const mockEvent = {
      id: 1,
      name: 'Evento Teste',
      location: 'São Paulo'
    }

    findByIdMock.mockResolvedValue(mockEvent)

    const response = await request(app).get('/events/1')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(mockEvent)
    expect(findByIdMock).toHaveBeenCalledWith(1)
  })

  test('deve retornar 404 quando o evento não for encontrado', async () => {
    findByIdMock.mockResolvedValue(null)

    const response = await request(app).get('/events/999')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      message: 'Event not found'
    })
    expect(findByIdMock).toHaveBeenCalledWith(999)
  })
})
