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

import { TicketStatus } from './ticket-model.js'
import { TicketStatusHistoryModel } from './ticket-status-history-model.js'

describe('TicketStatusHistoryModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar histórico de status com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await TicketStatusHistoryModel.create({
        ticket_id: 10,
        from_status: TicketStatus.available,
        to_status: TicketStatus.reserved
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_at) VALUES (?, ?, ?, ?)',
        [10, TicketStatus.available, TicketStatus.reserved, expect.any(Date)]
      )

      expect(result).toBeInstanceOf(TicketStatusHistoryModel)
      expect(result.id).toBe(1)
      expect(result.ticket_id).toBe(10)
      expect(result.from_status).toBe(TicketStatus.available)
      expect(result.to_status).toBe(TicketStatus.reserved)
      expect(result.changed_at).toBeInstanceOf(Date)
    })

    test('deve criar histórico de status com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await TicketStatusHistoryModel.create(
        {
          ticket_id: 11,
          from_status: TicketStatus.reserved,
          to_status: TicketStatus.sold
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO ticket_status_history (ticket_id, from_status, to_status, changed_at) VALUES (?, ?, ?, ?)',
        [11, TicketStatus.reserved, TicketStatus.sold, expect.any(Date)]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)
      expect(result.ticket_id).toBe(11)
      expect(result.from_status).toBe(TicketStatus.reserved)
      expect(result.to_status).toBe(TicketStatus.sold)
    })
  })

  describe('findById', () => {
    test('deve retornar histórico quando encontrado', async () => {
      const row = {
        id: 1,
        ticket_id: 10,
        from_status: TicketStatus.available,
        to_status: TicketStatus.reserved,
        changed_at: new Date('2026-03-30T18:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await TicketStatusHistoryModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE id = ?',
        [1]
      )
      expect(result).toBeInstanceOf(TicketStatusHistoryModel)
      expect(result?.id).toBe(1)
      expect(result?.ticket_id).toBe(10)
      expect(result?.from_status).toBe(TicketStatus.available)
      expect(result?.to_status).toBe(TicketStatus.reserved)
    })

    test('deve retornar null quando não encontrar histórico', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await TicketStatusHistoryModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE id = ?',
        [999]
      )
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os históricos sem filtro', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved,
          changed_at: new Date()
        },
        {
          id: 2,
          ticket_id: 10,
          from_status: TicketStatus.reserved,
          to_status: TicketStatus.sold,
          changed_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM ticket_status_history', [])
      expect(result).toHaveLength(2)
    })

    test('deve retornar históricos filtrando por ticket_id', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved,
          changed_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findAll({
        where: { ticket_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE ticket_id = ?',
        [10]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar históricos filtrando por from_status', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved,
          changed_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findAll({
        where: { from_status: TicketStatus.available }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE from_status = ?',
        [TicketStatus.available]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar históricos filtrando por to_status', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.reserved,
          to_status: TicketStatus.sold,
          changed_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findAll({
        where: { to_status: TicketStatus.sold }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE to_status = ?',
        [TicketStatus.sold]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar históricos com filtros combinados', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved,
          changed_at: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findAll({
        where: {
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved
        }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM ticket_status_history WHERE ticket_id = ? AND from_status = ? AND to_status = ?',
        [10, TicketStatus.available, TicketStatus.reserved]
      )
      expect(result).toHaveLength(1)
    })
  })

  describe('findByEventId', () => {
    test('deve retornar histórico de status por event_id', async () => {
      const rows = [
        {
          id: 1,
          ticket_id: 10,
          from_status: TicketStatus.available,
          to_status: TicketStatus.reserved,
          changed_at: new Date('2026-04-01T12:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketStatusHistoryModel.findByEventId(5)

      expect(executeMock).toHaveBeenCalledWith(
        expect.stringContaining('FROM ticket_status_history tsh'),
        [5]
      )
      expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('WHERE t.event_id = ?'), [5])
      expect(result).toHaveLength(1)
      expect(result[0].ticket_id).toBe(10)
    })
  })

  describe('delete', () => {
    test('deve deletar histórico com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const history = new TicketStatusHistoryModel({
        id: 1
      })

      await history.delete()

      expect(executeMock).toHaveBeenCalledWith(
        'DELETE FROM ticket_status_history WHERE id = ?',
        [1]
      )
    })

    test('deve lançar erro ao tentar deletar histórico inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const history = new TicketStatusHistoryModel({
        id: 999
      })

      await expect(history.delete()).rejects.toThrow('Ticket status history not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const changedAt = new Date('2026-03-30T18:00:00.000Z')
      const history = new TicketStatusHistoryModel()

      history.fill({
        id: 1,
        ticket_id: 10,
        from_status: TicketStatus.available,
        to_status: TicketStatus.reserved,
        changed_at: changedAt
      })

      expect(history.id).toBe(1)
      expect(history.ticket_id).toBe(10)
      expect(history.from_status).toBe(TicketStatus.available)
      expect(history.to_status).toBe(TicketStatus.reserved)
      expect(history.changed_at).toBe(changedAt)
    })
  })
})
