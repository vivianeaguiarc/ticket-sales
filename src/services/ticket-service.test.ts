import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findByIdMock, createManyMock } = vi.hoisted(() => {
  return {
    findByIdMock: vi.fn(),
    createManyMock: vi.fn()
  }
})

vi.mock('../models/event-model.js', () => {
  return {
    EventModel: {
      findById: findByIdMock
    }
  }
})

vi.mock('../models/ticket-model.js', () => {
  return {
    TicketStatus: {
      available: 'available'
    },
    TicketModel: {
      createMany: createManyMock
    }
  }
})

import { TicketModel } from '../models/ticket-model.js'
import { TicketService } from './ticket-service.js'

describe('TicketService', () => {
  const ticketService = new TicketService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMany', () => {
    test('deve criar vários tickets com sucesso', async () => {
      const input = {
        eventId: 1,
        numTickets: 3,
        price: 100
      }

      const mockEvent = {
        id: 1,
        name: 'Evento Teste'
      }

      findByIdMock.mockResolvedValue(mockEvent)
      createManyMock.mockResolvedValue(undefined)

      await ticketService.createMany(input)

      expect(findByIdMock).toHaveBeenCalledWith(1)

      expect(TicketModel.createMany).toHaveBeenCalledWith([
        {
          location: 'Location 0',
          event_id: 1,
          price: 100,
          status: 'available'
        },
        {
          location: 'Location 1',
          event_id: 1,
          price: 100,
          status: 'available'
        },
        {
          location: 'Location 2',
          event_id: 1,
          price: 100,
          status: 'available'
        }
      ])
    })

    test('deve lançar erro se o evento não existir', async () => {
      const input = {
        eventId: 999,
        numTickets: 3,
        price: 100
      }

      findByIdMock.mockResolvedValue(null)

      await expect(ticketService.createMany(input)).rejects.toThrow('Event not found')

      expect(findByIdMock).toHaveBeenCalledWith(999)
      expect(createManyMock).not.toHaveBeenCalled()
    })
  })
})
