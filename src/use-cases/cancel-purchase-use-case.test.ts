import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  getInstanceMock,
  getConnectionMock,
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  findAllMock,
  markAsAvailableMock,
  deleteMock
} = vi.hoisted(() => {
  return {
    getInstanceMock: vi.fn(),
    getConnectionMock: vi.fn(),
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    findAllMock: vi.fn(),
    markAsAvailableMock: vi.fn(),
    deleteMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

vi.mock('../models/purchase-ticket-model.js', () => {
  return {
    PurchaseTicketModel: {
      findAll: findAllMock
    }
  }
})

vi.mock('../models/ticket-model.js', () => {
  return {
    TicketModel: {
      markAsAvailable: markAsAvailableMock
    }
  }
})

import { CancelPurchaseUseCase } from './cancel-purchase-use-case.js'

describe('CancelPurchaseUseCase', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)
    markAsAvailableMock.mockResolvedValue(undefined)

    getConnectionMock.mockResolvedValue({
      beginTransaction: beginTransactionMock,
      commit: commitMock,
      rollback: rollbackMock,
      release: releaseMock
    })

    getInstanceMock.mockReturnValue({
      getConnection: getConnectionMock
    })
  })

  test('deve cancelar uma compra com sucesso', async () => {
    const purchaseTicket1 = {
      id: 1,
      purchase_id: 10,
      ticket_id: 101,
      delete: deleteMock
    }

    const purchaseTicket2 = {
      id: 2,
      purchase_id: 10,
      ticket_id: 102,
      delete: deleteMock
    }

    findAllMock.mockResolvedValue([purchaseTicket1, purchaseTicket2])

    await CancelPurchaseUseCase.execute({
      purchase_id: 10
    })

    expect(beginTransactionMock).toHaveBeenCalled()

    expect(findAllMock).toHaveBeenCalledWith(
      {
        where: {
          purchase_id: 10
        }
      },
      {
        connection: expect.any(Object)
      }
    )

    expect(markAsAvailableMock).toHaveBeenCalledTimes(2)
    expect(markAsAvailableMock).toHaveBeenNthCalledWith(1, 101, {
      connection: expect.any(Object)
    })
    expect(markAsAvailableMock).toHaveBeenNthCalledWith(2, 102, {
      connection: expect.any(Object)
    })

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(commitMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve lançar erro se purchase_id não for informado', async () => {
    await expect(
      CancelPurchaseUseCase.execute({
        purchase_id: 0
      })
    ).rejects.toThrow('Purchase id is required')
  })

  test('deve lançar erro se não encontrar purchase tickets', async () => {
    findAllMock.mockResolvedValue([])

    await expect(
      CancelPurchaseUseCase.execute({
        purchase_id: 10
      })
    ).rejects.toThrow('Purchase tickets not found')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se markAsAvailable lançar erro', async () => {
    const purchaseTicket = {
      id: 1,
      purchase_id: 10,
      ticket_id: 101,
      delete: deleteMock
    }

    findAllMock.mockResolvedValue([purchaseTicket])
    markAsAvailableMock.mockRejectedValue(new Error('Ticket not found'))

    await expect(
      CancelPurchaseUseCase.execute({
        purchase_id: 10
      })
    ).rejects.toThrow('Ticket not found')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se delete lançar erro', async () => {
    const purchaseTicket = {
      id: 1,
      purchase_id: 10,
      ticket_id: 101,
      delete: vi.fn().mockRejectedValue(new Error('Purchase ticket not found'))
    }

    findAllMock.mockResolvedValue([purchaseTicket])

    await expect(
      CancelPurchaseUseCase.execute({
        purchase_id: 10
      })
    ).rejects.toThrow('Purchase ticket not found')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })
})
