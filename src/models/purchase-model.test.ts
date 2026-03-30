import { beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, getInstanceMock } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database', () => {
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
    vi.clearAllMocks()

    getInstanceMock.mockReturnValue({
      execute: executeMock
    })
  })

  describe('create', () => {
    test('deve criar uma compra com sucesso usando Database.getInstance()', async () => {
      const purchaseDate = new Date('2026-03-30T14:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(purchaseDate)

      executeMock.mockResolvedValue([{ insertId: 1 }])

      const result = await PurchaseModel.create({
        customer_id: 10,
        total_amount: 150,
        status: PurchaseStatus.pending
      })

      expect(executeMock).toHaveBeenCalledWith(
        'INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)',
        [10, 150, PurchaseStatus.pending, purchaseDate]
      )

      expect(result).toBeInstanceOf(PurchaseModel)
      expect(result.id).toBe(1)
      expect(result.customer_id).toBe(10)
      expect(result.total_amount).toBe(150)
      expect(result.status).toBe(PurchaseStatus.pending)
      expect(result.purchase_date).toEqual(purchaseDate)

      vi.useRealTimers()
    })

    test('deve criar uma compra com sucesso usando connection nas options', async () => {
      const purchaseDate = new Date('2026-03-30T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(purchaseDate)

      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ insertId: 2 }])

      const result = await PurchaseModel.create(
        {
          customer_id: 20,
          total_amount: 300,
          status: PurchaseStatus.paid
        },
        {
          connection: connection as unknown as PoolConnection
        }
      )

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)',
        [20, 300, PurchaseStatus.paid, purchaseDate]
      )

      expect(executeMock).not.toHaveBeenCalled()
      expect(result).toBeInstanceOf(PurchaseModel)
      expect(result.id).toBe(2)
      expect(result.customer_id).toBe(20)
      expect(result.total_amount).toBe(300)
      expect(result.status).toBe(PurchaseStatus.paid)
      expect(result.purchase_date).toEqual(purchaseDate)

      vi.useRealTimers()
    })
  })

  describe('findById', () => {
    test('deve retornar uma compra quando encontrada', async () => {
      const row = {
        id: 1,
        customer_id: 10,
        purchase_date: new Date('2026-03-30T14:00:00.000Z'),
        total_amount: 150,
        status: PurchaseStatus.pending
      }

      executeMock.mockResolvedValue([[row]])

      const result = await PurchaseModel.findById(1)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases WHERE id = ?', [1])
      expect(result).toBeInstanceOf(PurchaseModel)
      expect(result?.id).toBe(1)
      expect(result?.customer_id).toBe(10)
      expect(result?.total_amount).toBe(150)
      expect(result?.status).toBe(PurchaseStatus.pending)
    })

    test('deve retornar null quando não encontrar compra', async () => {
      executeMock.mockResolvedValue([[]])

      const result = await PurchaseModel.findById(999)

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases WHERE id = ?', [999])
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    test('deve retornar todas as compras', async () => {
      const rows = [
        {
          id: 1,
          customer_id: 10,
          purchase_date: new Date('2026-03-30T14:00:00.000Z'),
          total_amount: 150,
          status: PurchaseStatus.pending
        },
        {
          id: 2,
          customer_id: 20,
          purchase_date: new Date('2026-03-30T15:00:00.000Z'),
          total_amount: 300,
          status: PurchaseStatus.paid
        }
      ]

      executeMock.mockResolvedValue([rows])

      const result = await PurchaseModel.findAll()

      expect(executeMock).toHaveBeenCalledWith('SELECT * FROM purchases')
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(PurchaseModel)
      expect(result[1]).toBeInstanceOf(PurchaseModel)
      expect(result[0].status).toBe(PurchaseStatus.pending)
      expect(result[1].status).toBe(PurchaseStatus.paid)
    })
  })

  describe('update', () => {
    test('deve atualizar uma compra com sucesso usando Database.getInstance()', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchase = new PurchaseModel({
        id: 1,
        customer_id: 10,
        total_amount: 200,
        status: PurchaseStatus.paid
      })

      await purchase.update()

      expect(executeMock).toHaveBeenCalledWith(
        'UPDATE purchases SET customer_id = ?, total_amount = ?, status = ? WHERE id = ?',
        [10, 200, PurchaseStatus.paid, 1]
      )
    })

    test('deve atualizar uma compra com sucesso usando connection nas options', async () => {
      const connectionExecuteMock = vi.fn()
      const connection = {
        execute: connectionExecuteMock
      }

      connectionExecuteMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchase = new PurchaseModel({
        id: 2,
        customer_id: 20,
        total_amount: 350,
        status: PurchaseStatus.error
      })

      await purchase.update({
        connection: connection as unknown as PoolConnection
      })

      expect(connectionExecuteMock).toHaveBeenCalledWith(
        'UPDATE purchases SET customer_id = ?, total_amount = ?, status = ? WHERE id = ?',
        [20, 350, PurchaseStatus.error, 2]
      )

      expect(executeMock).not.toHaveBeenCalled()
    })

    test('deve lançar erro ao tentar atualizar compra inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchase = new PurchaseModel({
        id: 999,
        customer_id: 10,
        total_amount: 100,
        status: PurchaseStatus.pending
      })

      await expect(purchase.update()).rejects.toThrow('Purchase not found')
    })
  })

  describe('delete', () => {
    test('deve deletar uma compra com sucesso', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 1 }])

      const purchase = new PurchaseModel({
        id: 1
      })

      await purchase.delete()

      expect(executeMock).toHaveBeenCalledWith('DELETE FROM purchases WHERE id = ?', [1])
    })

    test('deve lançar erro ao tentar deletar compra inexistente', async () => {
      executeMock.mockResolvedValue([{ affectedRows: 0 }])

      const purchase = new PurchaseModel({
        id: 999
      })

      await expect(purchase.delete()).rejects.toThrow('Purchase not found')
    })
  })

  describe('fill', () => {
    test('deve preencher todos os campos informados', () => {
      const purchaseDate = new Date('2026-03-30T14:00:00.000Z')

      const purchase = new PurchaseModel()

      purchase.fill({
        id: 1,
        customer_id: 10,
        purchase_date: purchaseDate,
        total_amount: 150,
        status: PurchaseStatus.pending
      })

      expect(purchase.id).toBe(1)
      expect(purchase.customer_id).toBe(10)
      expect(purchase.purchase_date).toEqual(purchaseDate)
      expect(purchase.total_amount).toBe(150)
      expect(purchase.status).toBe(PurchaseStatus.pending)
    })

    test('deve preencher parcialmente sem sobrescrever campos não informados', () => {
      const purchaseDate = new Date('2026-03-30T14:00:00.000Z')

      const purchase = new PurchaseModel({
        id: 1,
        customer_id: 10,
        purchase_date: purchaseDate,
        total_amount: 150,
        status: PurchaseStatus.pending
      })

      purchase.fill({
        status: PurchaseStatus.paid,
        total_amount: 200
      })

      expect(purchase.id).toBe(1)
      expect(purchase.customer_id).toBe(10)
      expect(purchase.purchase_date).toEqual(purchaseDate)
      expect(purchase.total_amount).toBe(200)
      expect(purchase.status).toBe(PurchaseStatus.paid)
    })
  })
})
