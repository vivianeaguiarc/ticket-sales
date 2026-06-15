import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'

const {
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  getConnectionMock,
  createEventMock,
  createAuditLogMock,
  findStatusHistoryByEventIdMock,
  findAuditLogsByEventIdMock
} = vi.hoisted(() => {
  return {
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    getConnectionMock: vi.fn(),
    createEventMock: vi.fn(),
    createAuditLogMock: vi.fn(),
    findStatusHistoryByEventIdMock: vi.fn(),
    findAuditLogsByEventIdMock: vi.fn()
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

vi.mock('../models/event-model.js', () => ({
  EventModel: {
    create: createEventMock,
    findAll: vi.fn(),
    findById: vi.fn()
  }
}))

vi.mock('../models/audit-log-model.js', () => ({
  AuditAction: {
    EVENT_CREATED: 'EVENT_CREATED',
    PURCHASE_CREATED: 'PURCHASE_CREATED'
  },
  AuditEntityType: {
    event: 'event',
    purchase: 'purchase'
  },
  AuditLogModel: {
    create: createAuditLogMock,
    findByEventId: findAuditLogsByEventIdMock
  }
}))

vi.mock('../models/ticket-status-history-model.js', () => ({
  TicketStatusHistoryModel: {
    findByEventId: findStatusHistoryByEventIdMock
  }
}))

vi.mock('../models/ticket-model.js', () => ({
  TicketStatus: {
    available: 'available',
    reserved: 'reserved',
    sold: 'sold'
  }
}))

import { EventModel } from '../models/event-model.js'
import { EventService } from './event-service.js'

describe('EventService', () => {
  const eventService = new EventService()

  beforeEach(() => {
    vi.clearAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)
    getConnectionMock.mockResolvedValue(connection)
    createAuditLogMock.mockResolvedValue({})
  })

  describe('create', () => {
    test('deve criar um evento com audit log na mesma transação', async () => {
      const input = {
        name: 'Evento Teste',
        description: 'Descrição teste',
        date: new Date(),
        location: 'São Paulo',
        partnerId: 1,
        userId: 5
      }

      const mockEvent = {
        id: 10,
        date: input.date,
        created_at: new Date()
      }

      createEventMock.mockResolvedValue(mockEvent)

      const result = await eventService.create(input)

      expect(beginTransactionMock).toHaveBeenCalled()
      expect(EventModel.create).toHaveBeenCalledWith(
        {
          partner_id: input.partnerId,
          name: input.name,
          description: input.description,
          date: input.date,
          location: input.location
        },
        { connection }
      )
      expect(createAuditLogMock).toHaveBeenCalledWith(
        {
          user_id: 5,
          action: 'EVENT_CREATED',
          entity_type: 'event',
          entity_id: 10,
          new_data: {
            partner_id: input.partnerId,
            name: input.name,
            description: input.description,
            date: input.date,
            location: input.location
          }
        },
        { connection }
      )
      expect(commitMock).toHaveBeenCalled()
      expect(rollbackMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalled()

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

    test('deve fazer rollback se audit log falhar', async () => {
      const input = {
        name: 'Evento Teste',
        description: null as string | null,
        date: new Date(),
        location: 'Rio de Janeiro',
        partnerId: 2,
        userId: 3
      }

      ;(EventModel.create as Mock).mockResolvedValue({
        id: 1,
        date: input.date,
        created_at: new Date()
      })
      createAuditLogMock.mockRejectedValue(new Error('Audit log failed'))

      await expect(eventService.create(input)).rejects.toThrow('Audit log failed')

      expect(rollbackMock).toHaveBeenCalled()
      expect(commitMock).not.toHaveBeenCalled()
      expect(releaseMock).toHaveBeenCalled()
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
  })

  describe('findById', () => {
    test('deve retornar um evento pelo id', async () => {
      const mockEvent = { id: 99 }

      ;(EventModel.findById as Mock).mockResolvedValue(mockEvent)

      const result = await eventService.findById(99)

      expect(EventModel.findById).toHaveBeenCalledWith(99)
      expect(result).toEqual(mockEvent)
    })
  })

  describe('getHistory', () => {
    test('deve retornar histórico mesclado em ordem decrescente', async () => {
      findStatusHistoryByEventIdMock.mockResolvedValue([
        {
          ticket_id: 1,
          from_status: 'available',
          to_status: 'reserved',
          changed_at: new Date('2026-04-01T12:00:00.000Z')
        }
      ])
      findAuditLogsByEventIdMock.mockResolvedValue([
        {
          action: 'PURCHASE_CREATED',
          entity_type: 'purchase',
          entity_id: 3,
          created_at: new Date('2026-04-01T12:05:00.000Z')
        }
      ])

      const result = await eventService.getHistory(10)

      expect(findStatusHistoryByEventIdMock).toHaveBeenCalledWith(10)
      expect(findAuditLogsByEventIdMock).toHaveBeenCalledWith(10)
      expect(result).toEqual([
        {
          type: 'audit_log',
          action: 'PURCHASE_CREATED',
          entity_type: 'purchase',
          entity_id: 3,
          created_at: '2026-04-01T12:05:00.000Z'
        },
        {
          type: 'ticket_status_history',
          ticket_id: 1,
          from_status: 'available',
          to_status: 'reserved',
          changed_at: '2026-04-01T12:00:00.000Z'
        }
      ])
    })

    test('deve retornar lista vazia quando não houver histórico', async () => {
      findStatusHistoryByEventIdMock.mockResolvedValue([])
      findAuditLogsByEventIdMock.mockResolvedValue([])

      const result = await eventService.getHistory(10)

      expect(result).toEqual([])
    })
  })
})
