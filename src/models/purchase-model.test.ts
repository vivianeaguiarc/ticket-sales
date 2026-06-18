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

import { PurchaseModel, PurchaseStatus } from './purchase-model.js'

describe('PurchaseModel', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar uma purchase com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await PurchaseModel.create({
        customer_id: 10,
        total_amount: 300,
        status: PurchaseStatus.pending
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)',
        [10, 300, PurchaseStatus.pending, expect.any(Date)]
      )

      expect(result).toBeInstanceOf(PurchaseModel)
      expect(result.id).toBe(1)
      expect(result.customer_id).toBe(10)
      expect(result.total_amount).toBe(300)
      expect(result.status).toBe(PurchaseStatus.pending)
      expect(result.purchase_date).toBeInstanceOf(Date)
    })

    test('deve criar uma purchase com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await PurchaseModel.create(
        {
          customer_id: 20,
          total_amount: 500,
          status: PurchaseStatus.paid
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)',
        [20, 500, PurchaseStatus.paid, expect.any(Date)]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result.id).toBe(2)
      expect(result.customer_id).toBe(20)
      expect(result.total_amount).toBe(500)
      expect(result.status).toBe(PurchaseStatus.paid)
    })
  })

  describe('findById', () => {
    test('deve retornar uma purchase quando encontrada', async () => {
      const row = {
        id: 1,
        customer_id: 10,
        total_amount: 300,
        status: PurchaseStatus.pending,
        purchase_date: new Date('2026-03-30T18:00:00.000Z')
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PurchaseModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases WHERE id = ?', [1])
      expect(result).toBeInstanceOf(PurchaseModel)
      expect(result?.id).toBe(1)
      expect(result?.customer_id).toBe(10)
      expect(result?.total_amount).toBe(300)
      expect(result?.status).toBe(PurchaseStatus.pending)
    })

    test('deve retornar null quando não encontrar purchase', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PurchaseModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases WHERE id = ?', [999])
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todas as purchases sem filtro', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          total_amount: 300,
          status: PurchaseStatus.pending,
          purchase_date: new Date()
        },
        {
          id: 2,
          customer_id: 11,
          total_amount: 500,
          status: PurchaseStatus.paid,
          purchase_date: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases', [])
      expect(result).toHaveLength(2)
    })

    test('deve retornar purchases filtrando por customer_id', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          total_amount: 300,
          status: PurchaseStatus.pending,
          purchase_date: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findAll({
        where: { customer_id: 10 }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchases WHERE customer_id = ?',
        [10]
      )
      expect(result).toHaveLength(1)
    })

    test('deve retornar purchases filtrando por status', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          total_amount: 300,
          status: PurchaseStatus.pending,
          purchase_date: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findAll({
        where: { status: PurchaseStatus.pending }
      })

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases WHERE status = ?', [
        PurchaseStatus.pending
      ])
      expect(result).toHaveLength(1)
    })

    test('deve retornar purchases filtrando por customer_id e status', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          total_amount: 300,
          status: PurchaseStatus.pending,
          purchase_date: new Date()
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findAll({
        where: {
          customer_id: 10,
          status: PurchaseStatus.pending
        }
      })

      expect(executeMock).toHaveBeenCalledWith(
        'SELECT * FROM purchases WHERE customer_id = ? AND status = ?',
        [10, PurchaseStatus.pending]
      )
      expect(result).toHaveLength(1)
    })
  })

  describe('findByCustomerIdWithTicketsAndEvents', () => {
    test('deve retornar compras enriquecidas com tickets e eventos', async () => {
      const purchaseDate = new Date('2026-06-15T00:00:00.000Z')
      const eventDate = new Date('2027-08-01T10:00:00.000Z')

      const rows = [
        {
          purchase_id: 1,
          purchase_status: PurchaseStatus.paid,
          total_amount: 200,
          purchase_date: purchaseDate,
          ticket_id: 3,
          ticket_location: 'A1',
          ticket_price: 100,
          ticket_status: 'sold',
          event_id: 1,
          event_name: 'Evento Final',
          event_date: eventDate,
          event_location: 'São Paulo'
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findByCustomerIdWithTicketsAndEvents(10)

      expect(executeMock).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.customer_id = ?'),
        [10]
      )
      expect(result).toHaveLength(1)
      expect(result[0]?.tickets[0]?.event.name).toBe('Evento Final')
    })

    test('deve retornar lista vazia quando customer não tiver compras', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PurchaseModel.findByCustomerIdWithTicketsAndEvents(10)

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    test('deve atualizar uma purchase com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchase = new PurchaseModel({
        id: 1,
        customer_id: 99,
        total_amount: 900,
        status: PurchaseStatus.paid
      })

      await purchase.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE purchases SET customer_id = ?, total_amount = ?, status = ? WHERE id = ?',
        [99, 900, PurchaseStatus.paid, 1]
      )
    })

    test('deve lançar erro ao tentar atualizar purchase inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchase = new PurchaseModel({
        id: 999,
        customer_id: 99,
        total_amount: 900,
        status: PurchaseStatus.paid
      })

      await expect(purchase.update()).rejects.toThrow('Purchase not found')
    })
  })

  describe('delete', () => {
    test('deve deletar uma purchase com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchase = new PurchaseModel({
        id: 1
      })

      await purchase.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM purchases WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar purchase inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchase = new PurchaseModel({
        id: 999
      })

      await expect(purchase.delete()).rejects.toThrow('Purchase not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const purchase = new PurchaseModel()
      const purchaseDate = new Date('2026-03-30T18:00:00.000Z')

      purchase.fill({
        id: 1,
        customer_id: 10,
        purchase_date: purchaseDate,
        total_amount: 300,
        status: PurchaseStatus.pending
      })

      expect(purchase.id).toBe(1)
      expect(purchase.customer_id).toBe(10)
      expect(purchase.purchase_date).toBe(purchaseDate)
      expect(purchase.total_amount).toBe(300)
      expect(purchase.status).toBe(PurchaseStatus.pending)
    })
  })
})
