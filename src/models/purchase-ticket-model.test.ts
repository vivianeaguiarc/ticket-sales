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

import { PurchaseTicketModel } from './purchase-ticket-model.js'

describe('PurchaseTicketModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar um purchase ticket com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await PurchaseTicketModel.create({
        purchase_id: 10,
        ticket_id: 20
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES (?, ?)',
        [10, 20]
      )

      expect(result).toBeInstanceOf(PurchaseTicketModel)
      expect(result.id).toBe(1)
      expect(result.purchase_id).toBe(10)
      expect(result.ticket_id).toBe(20)
    })

    test('deve criar um purchase ticket com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await PurchaseTicketModel.create(
        {
          purchase_id: 30,
          ticket_id: 40
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES (?, ?)',
        [30, 40]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(PurchaseTicketModel)
      expect(result.id).toBe(2)
      expect(result.purchase_id).toBe(30)
      expect(result.ticket_id).toBe(40)
    })
  })

  describe('createMany', () => {
    test('deve criar vários purchase tickets com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 5 }])

      const input = [
        {
          purchase_id: 1,
          ticket_id: 101
        },
        {
          purchase_id: 1,
          ticket_id: 102
        },
        {
          purchase_id: 1,
          ticket_id: 103
        }
      ]

      const result = await PurchaseTicketModel.createMany(input)

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES (?, ?), (?, ?), (?, ?)',
        [1, 101, 1, 102, 1, 103]
      )

      expect(result).toHaveLength(3)
      expect(result[0]).toBeInstanceOf(PurchaseTicketModel)
      expect(result[1]).toBeInstanceOf(PurchaseTicketModel)
      expect(result[2]).toBeInstanceOf(PurchaseTicketModel)

      expect(result[0].id).toBe(5)
      expect(result[1].id).toBe(6)
      expect(result[2].id).toBe(7)

      expect(result[0].purchase_id).toBe(1)
      expect(result[1].purchase_id).toBe(1)
      expect(result[2].purchase_id).toBe(1)

      expect(result[0].ticket_id).toBe(101)
      expect(result[1].ticket_id).toBe(102)
      expect(result[2].ticket_id).toBe(103)
    })

    test('deve criar vários purchase tickets com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      const input = [
        {
          purchase_id: 10,
          ticket_id: 201
        },
        {
          purchase_id: 10,
          ticket_id: 202
        }
      ]

      connectionExecuteMock.mockResolvedValue([{ insertId: 10 }])

      const result = await PurchaseTicketModel.createMany(input, {
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO purchase_tickets (purchase_id, ticket_id) VALUES (?, ?), (?, ?)',
        [10, 201, 10, 202]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(10)
      expect(result[1].id).toBe(11)
      expect(result[0].purchase_id).toBe(10)
      expect(result[1].purchase_id).toBe(10)
      expect(result[0].ticket_id).toBe(201)
      expect(result[1].ticket_id).toBe(202)
    })
  })

  describe('findById', () => {
    test('deve retornar um purchase ticket quando encontrado', async () => {
      const row = {
        id: 1,
        purchase_id: 10,
        ticket_id: 20
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PurchaseTicketModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchase_tickets WHERE id = ? LIMIT 1',
        [1]
      )
      expect(result).toBeInstanceOf(PurchaseTicketModel)
      expect(result?.id).toBe(1)
      expect(result?.purchase_id).toBe(10)
      expect(result?.ticket_id).toBe(20)
    })

    test('deve retornar null quando não encontrar purchase ticket', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PurchaseTicketModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchase_tickets WHERE id = ? LIMIT 1',
        [999]
      )
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todos os purchase tickets sem filtro', async () => {
      const rows = [
        {
          id: 1,
          purchase_id: 10,
          ticket_id: 20
        },
        {
          id: 2,
          purchase_id: 11,
          ticket_id: 21
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseTicketModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchase_tickets', [])
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(PurchaseTicketModel)
      expect(result[1]).toBeInstanceOf(PurchaseTicketModel)
    })

    test('deve retornar purchase tickets filtrando por purchase_id', async () => {
      const rows = [
        {
          id: 1,
          purchase_id: 10,
          ticket_id: 20
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseTicketModel.findAll({
        where: { purchase_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchase_tickets WHERE purchase_id = ?',
        [10]
      )
      expect(result).toHaveLength(1)
      expect(result[0].purchase_id).toBe(10)
    })

    test('deve retornar purchase tickets filtrando por ticket_id', async () => {
      const rows = [
        {
          id: 2,
          purchase_id: 30,
          ticket_id: 99
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseTicketModel.findAll({
        where: { ticket_id: 99 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchase_tickets WHERE ticket_id = ?',
        [99]
      )
      expect(result).toHaveLength(1)
      expect(result[0].ticket_id).toBe(99)
    })

    test('deve retornar purchase tickets filtrando por purchase_id e ticket_id', async () => {
      const rows = [
        {
          id: 3,
          purchase_id: 50,
          ticket_id: 60
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseTicketModel.findAll({
        where: { purchase_id: 50, ticket_id: 60 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchase_tickets WHERE purchase_id = ? AND ticket_id = ?',
        [50, 60]
      )
      expect(result).toHaveLength(1)
      expect(result[0].purchase_id).toBe(50)
      expect(result[0].ticket_id).toBe(60)
    })
  })

  describe('update', () => {
    test('deve atualizar um purchase ticket com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 1,
        purchase_id: 99,
        ticket_id: 88
      })

      await purchaseTicket.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE purchase_tickets SET purchase_id = ?, ticket_id = ? WHERE id = ?',
        [99, 88, 1]
      )
    })

    test('deve atualizar um purchase ticket com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 2,
        purchase_id: 50,
        ticket_id: 60
      })

      await purchaseTicket.update({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'UPDATE purchase_tickets SET purchase_id = ?, ticket_id = ? WHERE id = ?',
        [50, 60, 2]
      )

      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar atualizar purchase ticket inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 999,
        purchase_id: 10,
        ticket_id: 20
      })

      await expect(purchaseTicket.update()).rejects.toThrow('Purchase ticket not found')
    })
  })

  describe('delete', () => {
    test('deve deletar um purchase ticket com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 1
      })

      await purchaseTicket.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM purchase_tickets WHERE id = ?', [1])
    })

    test('deve deletar um purchase ticket com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 2
      })

      await purchaseTicket.delete({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'DELETE FROM purchase_tickets WHERE id = ?',
        [2]
      )
      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar deletar purchase ticket inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchaseTicket = new PurchaseTicketModel({
        id: 999
      })

      await expect(purchaseTicket.delete()).rejects.toThrow('Purchase ticket not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const purchaseTicket = new PurchaseTicketModel()

      purchaseTicket.fill({
        id: 1,
        purchase_id: 10,
        ticket_id: 20
      })

      expect(purchaseTicket.id).toBe(1)
      expect(purchaseTicket.purchase_id).toBe(10)
      expect(purchaseTicket.ticket_id).toBe(20)
    })

    test('deve preencher com valores padrão quando campos não forem informados', () => {
      const purchaseTicket = new PurchaseTicketModel()

      expect(purchaseTicket.id).toBe(0)
      expect(purchaseTicket.purchase_id).toBe(0)
      expect(purchaseTicket.ticket_id).toBe(0)
    })

    test('deve sobrescrever os campos ao chamar fill novamente', () => {
      const purchaseTicket = new PurchaseTicketModel()

      purchaseTicket.fill({
        id: 1,
        purchase_id: 10,
        ticket_id: 20
      })

      purchaseTicket.fill({
        id: 2,
        purchase_id: 30,
        ticket_id: 40
      })

      expect(purchaseTicket.id).toBe(2)
      expect(purchaseTicket.purchase_id).toBe(30)
      expect(purchaseTicket.ticket_id).toBe(40)
    })
  })
})
