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

import { TicketModel, TicketStatus } from './ticket-model.js'

describe('TicketModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um ticket com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await TicketModel.create({
        location: 'Location A',
        event_id: 10,
        price: 100,
        status: TicketStatus.available
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Location A', 10, 100, TicketStatus.available, createdAt]
      )

      expect(result).toBeInstanceOf(TicketModel)
      expect(result.id).toBe(1)
      expect(result.location).toBe('Location A')
      expect(result.event_id).toBe(10)
      expect(result.price).toBe(100)
      expect(result.status).toBe(TicketStatus.available)
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar um ticket com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T12:30:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await TicketModel.create(
        {
          location: 'Location B',
          event_id: 20,
          price: 150,
          status: TicketStatus.reserved
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?)',
        ['Location B', 20, 150, TicketStatus.reserved, createdAt]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(TicketModel)
      expect(result.id).toBe(2)
      expect(result.status).toBe(TicketStatus.reserved)
      expect(result.created_at).toEqual(createdAt)

      vi.useRealTimers()
    })
  })

  describe('createMany', () => {
    test('deve criar vários tickets com sucesso usando Database.getInstance()', async () => {
      const createdAt = new Date('2026-03-29T13:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      executeMock.mockResolvedValue([{ insertId: 5 }])

      const input = [
        {
          location: 'Location 0',
          event_id: 1,
          price: 100,
          status: TicketStatus.available
        },
        {
          location: 'Location 1',
          event_id: 1,
          price: 100,
          status: TicketStatus.reserved
        },
        {
          location: 'Location 2',
          event_id: 1,
          price: 100,
          status: TicketStatus.sold
        }
      ]

      const result = await TicketModel.createMany(input)

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [
          'Location 0',
          1,
          100,
          TicketStatus.available,
          createdAt,
          'Location 1',
          1,
          100,
          TicketStatus.reserved,
          createdAt,
          'Location 2',
          1,
          100,
          TicketStatus.sold,
          createdAt
        ]
      )

      expect(result).toHaveLength(3)
      expect(result[0]).toBeInstanceOf(TicketModel)
      expect(result[1]).toBeInstanceOf(TicketModel)
      expect(result[2]).toBeInstanceOf(TicketModel)

      expect(result[0].id).toBe(5)
      expect(result[1].id).toBe(6)
      expect(result[2].id).toBe(7)

      expect(result[0].created_at).toEqual(createdAt)
      expect(result[1].created_at).toEqual(createdAt)
      expect(result[2].created_at).toEqual(createdAt)

      vi.useRealTimers()
    })

    test('deve criar vários tickets com sucesso usando connection nas options', async () => {
      const createdAt = new Date('2026-03-29T13:30:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(createdAt)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      const input = [
        {
          location: 'Sector A1',
          event_id: 2,
          price: 200,
          status: TicketStatus.available
        },
        {
          location: 'Sector A2',
          event_id: 2,
          price: 200,
          status: TicketStatus.available
        }
      ]

      connectionExecuteMock.mockResolvedValue([{ insertId: 10 }])

      const result = await TicketModel.createMany(input, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        [
          'Sector A1',
          2,
          200,
          TicketStatus.available,
          createdAt,
          'Sector A2',
          2,
          200,
          TicketStatus.available,
          createdAt
        ]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(10)
      expect(result[1].id).toBe(11)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar um ticket quando encontrado', async () => {
      const row = {
        id: 1,
        location: 'Location A',
        event_id: 10,
        price: 100,
        status: TicketStatus.available,
        created_at: new Date('2026-03-29T12:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await TicketModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets WHERE id = ? LIMIT 1', [1])
      expect(result).toBeInstanceOf(TicketModel)
      expect(result?.id).toBe(1)
      expect(result?.location).toBe('Location A')
    })

    test('deve retornar null quando não encontrar ticket', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await TicketModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets WHERE id = ? LIMIT 1', [999])
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os tickets sem filtro', async () => {
      const rows = [
        {
          id: 1,
          location: 'Location A',
          event_id: 10,
          price: 100,
          status: TicketStatus.available,
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          location: 'Location B',
          event_id: 20,
          price: 150,
          status: TicketStatus.sold,
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets', [])
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(TicketModel)
      expect(result[1]).toBeInstanceOf(TicketModel)
    })

    test('deve retornar tickets filtrando por event_id', async () => {
      const rows = [
        {
          id: 1,
          location: 'Location A',
          event_id: 10,
          price: 100,
          status: TicketStatus.available,
          created_at: new Date('2026-03-29T12:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll({
        where: { event_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets WHERE event_id = ?', [10])
      expect(result).toHaveLength(1)
      expect(result[0].event_id).toBe(10)
    })

    test('deve retornar tickets filtrando por ids', async () => {
      const rows = [
        {
          id: 1,
          location: 'Location A',
          event_id: 10,
          price: 100,
          status: TicketStatus.available,
          created_at: new Date('2026-03-29T12:00:00.000Z')
        },
        {
          id: 2,
          location: 'Location B',
          event_id: 20,
          price: 150,
          status: TicketStatus.sold,
          created_at: new Date('2026-03-29T13:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll({
        where: { ids: [1, 2] }
      })

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets WHERE id IN (?, ?)', [1, 2])
      expect(result).toHaveLength(2)
    })

    test('deve retornar tickets filtrando por status', async () => {
      const rows = [
        {
          id: 3,
          location: 'Location C',
          event_id: 30,
          price: 200,
          status: TicketStatus.reserved,
          created_at: new Date('2026-03-29T14:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll({
        where: { status: TicketStatus.reserved }
      })

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM tickets WHERE status = ?', [
        TicketStatus.reserved
      ])
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe(TicketStatus.reserved)
    })

    test('deve retornar tickets filtrando por event_id e ids', async () => {
      const rows = [
        {
          id: 1,
          location: 'Location A',
          event_id: 10,
          price: 100,
          status: TicketStatus.available,
          created_at: new Date('2026-03-29T12:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll({
        where: { event_id: 10, ids: [1, 2, 3] }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM tickets WHERE event_id = ? AND id IN (?, ?, ?)',
        [10, 1, 2, 3]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar tickets filtrando por event_id, ids e status', async () => {
      const rows = [
        {
          id: 2,
          location: 'Location B',
          event_id: 10,
          price: 180,
          status: TicketStatus.available,
          created_at: new Date('2026-03-29T15:00:00.000Z')
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await TicketModel.findAll({
        where: { event_id: 10, ids: [2, 3], status: TicketStatus.available }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM tickets WHERE event_id = ? AND id IN (?, ?) AND status = ?',
        [10, 2, 3, TicketStatus.available]
      )
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe(TicketStatus.available)
    })

    test('deve usar connection nas options quando fornecida', async () => {
      const connectionExecuteMock = vi.fn()
      connectionExecuteMock.mockResolvedValue([[]])

      const connection = {
        execute: connectionExecuteMock
      }

      await TicketModel.findAll(undefined, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith('SELECT * FROM tickets', [])
      expect(executeMock).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    test('deve atualizar ticket com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const ticket = new TicketModel({
        id: 1,
        location: 'Location Atualizada',
        event_id: 10,
        price: 200,
        status: TicketStatus.sold
      })

      await ticket.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE tickets SET location = ?, event_id = ?, price = ?, status = ? WHERE id = ?',
        ['Location Atualizada', 10, 200, TicketStatus.sold, 1]
      )
    })

    test('deve atualizar ticket com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const ticket = new TicketModel({
        id: 2,
        location: 'Location Reservada',
        event_id: 15,
        price: 250,
        status: TicketStatus.reserved
      })

      await ticket.update({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'UPDATE tickets SET location = ?, event_id = ?, price = ?, status = ? WHERE id = ?',
        ['Location Reservada', 15, 250, TicketStatus.reserved, 2]
      )

      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar atualizar ticket inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const ticket = new TicketModel({
        id: 999,
        location: 'Location X',
        event_id: 10,
        price: 200,
        status: TicketStatus.available
      })

      await expect(ticket.update()).rejects.toThrow('Ticket not found')
    })
  })

  describe('releaseIfReserved', () => {
    test('deve liberar ticket reservado e retornar true', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const result = await TicketModel.releaseIfReserved(1)

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE tickets SET status = ? WHERE id = ? AND status = ?',
        [TicketStatus.available, 1, TicketStatus.reserved]
      )
      expect(result).toBe(true)
    })

    test('deve retornar false quando ticket não estiver reservado', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const result = await TicketModel.releaseIfReserved(1)

      expect(result).toBe(false)
    })

    test('deve usar connection nas options quando fornecida', async () => {
      const connectionExecuteMock = vi.fn().mockResolvedValue([{ affectedRows: 1 }])
      const connection = {
        execute: connectionExecuteMock
      }

      await TicketModel.releaseIfReserved(2, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'UPDATE tickets SET status = ? WHERE id = ? AND status = ?',
        [TicketStatus.available, 2, TicketStatus.reserved]
      )
      expect(executeMock).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    test('deve deletar ticket com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const ticket = new TicketModel({
        id: 1
      })

      await ticket.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM tickets WHERE id = ?', [1])
    })

    test('deve deletar ticket com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const ticket = new TicketModel({
        id: 2
      })

      await ticket.delete({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith('DELETE FROM tickets WHERE id = ?', [2])
      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar deletar ticket inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const ticket = new TicketModel({
        id: 999
      })

      await expect(ticket.delete()).rejects.toThrow('Ticket not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')

      const ticket = new TicketModel()

      ticket.fill({
        id: 1,
        location: 'Location A',
        event_id: 10,
        price: 100,
        status: TicketStatus.available,
        created_at: createdAt
      })

      expect(ticket.id).toBe(1)
      expect(ticket.location).toBe('Location A')
      expect(ticket.event_id).toBe(10)
      expect(ticket.price).toBe(100)
      expect(ticket.status).toBe(TicketStatus.available)
      expect(ticket.created_at).toEqual(createdAt)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const createdAt = new Date('2026-03-29T12:00:00.000Z')

      const ticket = new TicketModel({
        id: 1,
        location: 'Location Original',
        event_id: 10,
        price: 100,
        status: TicketStatus.available,
        created_at: createdAt
      })

      ticket.fill({
        status: TicketStatus.sold,
        price: 150
      })

      expect(ticket.id).toBe(1)
      expect(ticket.location).toBe('Location Original')
      expect(ticket.event_id).toBe(10)
      expect(ticket.price).toBe(150)
      expect(ticket.status).toBe(TicketStatus.sold)
      expect(ticket.created_at).toEqual(createdAt)
    })
  })
})
