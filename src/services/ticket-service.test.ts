import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  findByIdMock,
  createManyMock,
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  getConnectionMock,
  createAuditLogMock
} = vi.hoisted(() => {
  return {
    findByIdMock: vi.fn(),
    createManyMock: vi.fn(),
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    getConnectionMock: vi.fn(),
    createAuditLogMock: vi.fn()
  }
})

const connection = {
  beginTransaction: beginTransactionMock,
  commit: commitMock,
  rollback: rollbackMock,
  release: releaseMock
}

vi.mock('../database.js', () => ({
  Database: {
    getInstance: vi.fn(() => ({
      getConnection: getConnectionMock
    }))
  }
}))

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

vi.mock('../models/audit-log-model.js', () => ({
  AuditAction: {
    TICKETS_CREATED: 'TICKETS_CREATED'
  },
  AuditEntityType: {
    ticket: 'ticket'
  },
  AuditLogModel: {
    create: createAuditLogMock
  }
}))

import { TicketModel } from '../models/ticket-model.js'
import { TicketService } from './ticket-service.js'

describe('TicketService', () => {
  const ticketService = new TicketService()

  beforeEach(() => {
    vi.clearAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)
    getConnectionMock.mockResolvedValue(connection)
    createAuditLogMock.mockResolvedValue({})
  })

  describe('createMany', () => {
    test('deve criar vários tickets com audit log na mesma transação', async () => {
      const input = {
        eventId: 1,
        numTickets: 3,
        price: 100,
        userId: 5
      }

      const mockEvent = {
        id: 1,
        name: 'Evento Teste'
      }

      findByIdMock.mockResolvedValue(mockEvent)
      createManyMock.mockResolvedValue([{ id: 101 }, { id: 102 }, { id: 103 }])

      await ticketService.createMany(input)

      expect(findByIdMock).toHaveBeenCalledWith(1)
      expect(TicketModel.createMany).toHaveBeenCalledWith(
        [
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
        ],
        { connection }
      )
      expect(createAuditLogMock).toHaveBeenCalledWith(
        {
          user_id: 5,
          action: 'TICKETS_CREATED',
          entity_type: 'ticket',
          entity_id: 1,
          new_data: {
            event_id: 1,
            ticket_ids: [101, 102, 103],
            quantity: 3,
            price: 100,
            status: 'available'
          }
        },
        { connection }
      )
      expect(commitMock).toHaveBeenCalled()
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalled()
    })

    test('deve lançar erro se o evento não existir', async () => {
      const input = {
        eventId: 999,
        numTickets: 3,
        price: 100,
        userId: 5
      }

      findByIdMock.mockResolvedValue(null)

      await expect(ticketService.createMany(input)).rejects.toThrow('Event not found')

      expect(findByIdMock).toHaveBeenCalledWith(999)
      expect(createManyMock).not.toHaveBeenCalled()
      expect(getConnectionMock).not.toHaveBeenCalled()
    })

    test('deve fazer rollback se audit log falhar', async () => {
      findByIdMock.mockResolvedValue({ id: 1 })
      createManyMock.mockResolvedValue([{ id: 101 }])
      createAuditLogMock.mockRejectedValue(new Error('Audit log failed'))

      await expect(
        ticketService.createMany({
          eventId: 1,
          numTickets: 1,
          price: 100,
          userId: 5
        })
      ).rejects.toThrow('Audit log failed')

      expect(rollbackMock).toHaveBeenCalled()
      expect(commitMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalled()
    })
  })
})
