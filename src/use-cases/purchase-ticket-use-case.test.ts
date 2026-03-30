import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  getInstanceMock,
  getConnectionMock,
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  createManyMock,
  reserveIfAvailableMock,
  markAsSoldMock
} = vi.hoisted(() => {
  return {
    getInstanceMock: vi.fn(),
    getConnectionMock: vi.fn(),
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    createManyMock: vi.fn(),
    reserveIfAvailableMock: vi.fn(),
    markAsSoldMock: vi.fn()
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
      createMany: createManyMock
    }
  }
})

vi.mock('../models/ticket-model.js', () => {
  return {
    TicketModel: {
      reserveIfAvailable: reserveIfAvailableMock,
      markAsSold: markAsSoldMock
    }
  }
})

import { PurchaseTicketUseCase } from './purchase-ticket-use-case.js'

describe('PurchaseTicketUseCase', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)

    reserveIfAvailableMock.mockResolvedValue(undefined)
    markAsSoldMock.mockResolvedValue(undefined)

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

  test('deve comprar tickets com sucesso', async () => {
    createManyMock.mockResolvedValue([
      { id: 1, purchase_id: 10, ticket_id: 101 },
      { id: 2, purchase_id: 10, ticket_id: 102 }
    ])

    const result = await PurchaseTicketUseCase.execute({
      purchase_id: 10,
      ticket_ids: [101, 102]
    })

    expect(beginTransactionMock).toHaveBeenCalled()

    expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(1, 101, {
      connection: expect.any(Object)
    })
    expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(2, 102, {
      connection: expect.any(Object)
    })

    expect(createManyMock).toHaveBeenCalledWith(
      [
        { purchase_id: 10, ticket_id: 101 },
        { purchase_id: 10, ticket_id: 102 }
      ],
      {
        connection: expect.any(Object)
      }
    )

    expect(markAsSoldMock).toHaveBeenCalledTimes(2)
    expect(markAsSoldMock).toHaveBeenNthCalledWith(1, 101, {
      connection: expect.any(Object)
    })
    expect(markAsSoldMock).toHaveBeenNthCalledWith(2, 102, {
      connection: expect.any(Object)
    })

    expect(commitMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  test('deve lançar erro se purchase_id não for informado', async () => {
    await expect(
      PurchaseTicketUseCase.execute({
        purchase_id: 0,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Purchase id is required')
  })

  test('deve lançar erro se não informar ticket_ids', async () => {
    await expect(
      PurchaseTicketUseCase.execute({
        purchase_id: 10,
        ticket_ids: []
      })
    ).rejects.toThrow('At least one ticket id is required')
  })

  test('deve fazer rollback se o ticket não estiver disponível', async () => {
    reserveIfAvailableMock.mockRejectedValue(new Error('Ticket is no longer available'))

    await expect(
      PurchaseTicketUseCase.execute({
        purchase_id: 10,
        ticket_ids: [101, 102]
      })
    ).rejects.toThrow('Ticket is no longer available')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se createMany lançar erro', async () => {
    createManyMock.mockRejectedValue(new Error('Database error'))

    await expect(
      PurchaseTicketUseCase.execute({
        purchase_id: 10,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Database error')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se markAsSold lançar erro', async () => {
    createManyMock.mockResolvedValue([{ id: 1, purchase_id: 10, ticket_id: 101 }])
    markAsSoldMock.mockRejectedValue(new Error('Ticket is not reserved'))

    await expect(
      PurchaseTicketUseCase.execute({
        purchase_id: 10,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Ticket is not reserved')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })
})
