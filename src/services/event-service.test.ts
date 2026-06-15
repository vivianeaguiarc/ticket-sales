import { beforeEach, describe, expect, test, vi } from 'vitest'

const { findStatusHistoryByEventIdMock, findAuditLogsByEventIdMock } = vi.hoisted(() => {
  return {
    findStatusHistoryByEventIdMock: vi.fn(),
    findAuditLogsByEventIdMock: vi.fn()
  }
})

vi.mock('../models/audit-log-model.js', () => ({
  AuditAction: {
    PURCHASE_CREATED: 'PURCHASE_CREATED'
  },
  AuditEntityType: {
    purchase: 'purchase'
  },
  AuditLogModel: {
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

import { EventService } from './event-service.js'

describe('EventService', () => {
  const eventService = new EventService()

  beforeEach(() => {
    vi.clearAllMocks()
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
