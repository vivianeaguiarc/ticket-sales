import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

import { PoolConnection } from 'mysql2/promise'

import { AuditAction, AuditEntityType, AuditLogModel } from './audit-log-model.js'

describe('AuditLogModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar audit log com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const newData = { event_id: 10, quantity: 3 }

      const result = await AuditLogModel.create({
        user_id: 5,
        action: AuditAction.TICKETS_CREATED,
        entity_type: AuditEntityType.ticket,
        entity_id: 10,
        new_data: newData
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          5,
          AuditAction.TICKETS_CREATED,
          AuditEntityType.ticket,
          10,
          null,
          JSON.stringify(newData),
          expect.any(Date)
        ]
      )

      expect(result).toBeInstanceOf(AuditLogModel)
      expect(result.id).toBe(1)
      expect(result.user_id).toBe(5)
      expect(result.action).toBe(AuditAction.TICKETS_CREATED)
      expect(result.entity_type).toBe(AuditEntityType.ticket)
      expect(result.entity_id).toBe(10)
      expect(result.new_data).toEqual(newData)
      expect(result.created_at).toBeInstanceOf(Date)
    })

    test('deve criar audit log com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const oldData = { status: 'paid' }
      const newData = { status: 'cancelled' }

      const result = await AuditLogModel.create(
        {
          user_id: 7,
          action: AuditAction.PURCHASE_CANCELLED,
          entity_type: AuditEntityType.purchase,
          entity_id: 99,
          old_data: oldData,
          new_data: newData
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          7,
          AuditAction.PURCHASE_CANCELLED,
          AuditEntityType.purchase,
          99,
          JSON.stringify(oldData),
          JSON.stringify(newData),
          expect.any(Date)
        ]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)
      expect(result.old_data).toEqual(oldData)
      expect(result.new_data).toEqual(newData)
    })

    test('deve aceitar user_id nulo para ações do sistema', async () => {
      executeMock.mockResolvedValue([{ insertId: 3 }])

      const result = await AuditLogModel.create({
        user_id: null,
        action: AuditAction.RESERVATION_EXPIRED,
        entity_type: AuditEntityType.reservation,
        entity_id: 15
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          null,
          AuditAction.RESERVATION_EXPIRED,
          AuditEntityType.reservation,
          15,
          null,
          null,
          expect.any(Date)
        ]
      )

      expect(result.user_id).toBeNull()
    })
  })

  describe('findById', () => {
    test('deve retornar audit log quando encontrado', async () => {
      const row = {
        id: 1,
        user_id: 5,
        action: AuditAction.EVENT_CREATED,
        entity_type: AuditEntityType.event,
        entity_id: 10,
        old_data: null,
        new_data: JSON.stringify({ name: 'Show' }),
        created_at: new Date('2026-03-30T18:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await AuditLogModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM audit_logs WHERE id = ?', [1])
      expect(result).toBeInstanceOf(AuditLogModel)
      expect(result?.id).toBe(1)
      expect(result?.action).toBe(AuditAction.EVENT_CREATED)
      expect(result?.new_data).toEqual({ name: 'Show' })
    })

    test('deve retornar null quando não encontrar audit log', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await AuditLogModel.findById(999)

      expect(result).toBeNull()
    })

    test('deve parsear old_data e new_data quando retornados como objeto', async () => {
      const row = {
        id: 2,
        user_id: 1,
        action: AuditAction.PURCHASE_CREATED,
        entity_type: AuditEntityType.purchase,
        entity_id: 20,
        old_data: { status: 'pending' },
        new_data: { status: 'paid' },
        created_at: new Date()
      }

      executeMock.mockResolvedValue([[row]])

      const result = await AuditLogModel.findById(2)

      expect(result?.old_data).toEqual({ status: 'pending' })
      expect(result?.new_data).toEqual({ status: 'paid' })
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os audit logs sem filtro', async () => {
      const rows = [
        {
          id: 1,
          user_id: 5,
          action: AuditAction.EVENT_CREATED,
          entity_type: AuditEntityType.event,
          entity_id: 10,
          old_data: null,
          new_data: null,
          created_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await AuditLogModel.findAll()

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM audit_logs ORDER BY created_at DESC',
        []
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar audit logs filtrando por action', async () => {
      const rows = [
        {
          id: 1,
          user_id: 5,
          action: AuditAction.TICKETS_RESERVED,
          entity_type: AuditEntityType.reservation,
          entity_id: 3,
          old_data: null,
          new_data: null,
          created_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await AuditLogModel.findAll({
        where: { action: AuditAction.TICKETS_RESERVED }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC',
        [AuditAction.TICKETS_RESERVED]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar audit logs com filtros combinados', async () => {
      executeMock.mockResolvedValue([[]])

      await AuditLogModel.findAll({
        where: {
          user_id: 5,
          action: AuditAction.PURCHASE_CREATED,
          entity_type: AuditEntityType.purchase,
          entity_id: 99
        }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM audit_logs WHERE user_id = ? AND action = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
        [5, AuditAction.PURCHASE_CREATED, AuditEntityType.purchase, 99]
      )
    })

    test('deve usar connection quando informada nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([[]])

      await AuditLogModel.findAll(undefined, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'SELECT * FROM audit_logs ORDER BY created_at DESC',
        []
      )
      expect(executeMock).not.toHaveBeenCalled()
    })
  })

  describe('findByEventId', () => {
    test('deve retornar audit logs relacionados ao evento', async () => {
      const rows = [
        {
          id: 1,
          user_id: 5,
          action: AuditAction.EVENT_CREATED,
          entity_type: AuditEntityType.event,
          entity_id: 10,
          old_data: null,
          new_data: null,
          created_at: new Date('2026-04-01T12:05:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await AuditLogModel.findByEventId(10)

      expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('FROM audit_logs al'), [
        AuditEntityType.event,
        10,
        AuditEntityType.ticket,
        10,
        AuditEntityType.reservation,
        AuditEntityType.purchase,
        10
      ])
      expect(result).toHaveLength(1)
      expect(result[0].action).toBe(AuditAction.EVENT_CREATED)
    })
  })
})
