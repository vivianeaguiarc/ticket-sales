import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

import { EventModel } from '../models/event-model.js'
import { EventService } from './event-service.js'

vi.mock('../models/event-model.js', () => ({
  EventModel: {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn()
  }
}))

describe('EventService', () => {
  const eventService = new EventService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    test('deve criar um evento com sucesso', async () => {
      const input = {
        name: 'Evento Teste',
        description: 'Descrição teste',
        date: new Date(),
        location: 'São Paulo',
        partnerId: 1
      }

      const mockEvent = {
        id: 10,
        date: input.date,
        created_at: new Date()
      }

      ;(EventModel.create as Mock).mockResolvedValue(mockEvent)

      const result = await eventService.create(input)

      expect(EventModel.create).toHaveBeenCalledWith({
        partner_id: input.partnerId,
        name: input.name,
        description: input.description,
        date: input.date,
        location: input.location
      })

      expect(result).toEqual({
        id: mockEvent.id,
        partner_id: input.partnerId,
        name: input.name,
        description: input.description,
        date: mockEvent.date,
        location: input.location,
        created_at: mockEvent.created_at
      })
    })

    test('deve chamar EventModel.create corretamente', async () => {
      const input = {
        name: 'Evento Teste',
        description: null as string | null,
        date: new Date(),
        location: 'Rio de Janeiro',
        partnerId: 2
      }

      ;(EventModel.create as Mock).mockResolvedValue({
        id: 1,
        date: input.date,
        created_at: new Date()
      })

      await eventService.create(input)

      expect(EventModel.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('findAll', () => {
    test('deve retornar eventos filtrando por partnerId', async () => {
      const mockEvents = [{ id: 1 }, { id: 2 }]

      ;(EventModel.findAll as Mock).mockResolvedValue(mockEvents)

      const result = await eventService.findAll(1)

      expect(EventModel.findAll).toHaveBeenCalledWith({
        where: { partner_id: 1 }
      })

      expect(result).toEqual(mockEvents)
    })

    test('deve retornar eventos mesmo sem partnerId', async () => {
      const mockEvents = [{ id: 1 }]

      ;(EventModel.findAll as Mock).mockResolvedValue(mockEvents)

      const result = await eventService.findAll()

      expect(EventModel.findAll).toHaveBeenCalledWith({
        where: { partner_id: undefined }
      })

      expect(result).toEqual(mockEvents)
    })
  })

  describe('findById', () => {
    test('deve retornar um evento pelo id', async () => {
      const mockEvent = { id: 99 }

      ;(EventModel.findById as Mock).mockResolvedValue(mockEvent)

      const result = await eventService.findById(99)

      expect(EventModel.findById).toHaveBeenCalledWith(99)
      expect(result).toEqual(mockEvent)
    })

    test('deve retornar null se evento não existir', async () => {
      ;(EventModel.findById as Mock).mockResolvedValue(null)

      const result = await eventService.findById(999)

      expect(result).toBeNull()
    })
  })
})
