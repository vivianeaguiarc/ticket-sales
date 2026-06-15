import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  getInstanceMock,
  getConnectionMock,
  beginTransactionMock,
  commitMock,
  rollbackMock,
  releaseMock,
  reserveIfAvailableMock,
  createMock,
  createHistoryMock
} = vi.hoisted(() => {
  return {
    getInstanceMock: vi.fn(),
    getConnectionMock: vi.fn(),
    beginTransactionMock: vi.fn(),
    commitMock: vi.fn(),
    rollbackMock: vi.fn(),
    releaseMock: vi.fn(),
    reserveIfAvailableMock: vi.fn(),
    createMock: vi.fn(),
    createHistoryMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

vi.mock('../models/ticket-model.js', () => {
  return {
    TicketStatus: {
      available: 'available',
      reserved: 'reserved',
      sold: 'sold'
    },
    TicketModel: {
      reserveIfAvailable: reserveIfAvailableMock
    }
  }
})

vi.mock('../models/reservation-ticket-model.js', () => {
  return {
    ReservationStatus: {
      reserved: 'reserved',
      cancelled: 'cancelled'
    },
    ReservationTicketModel: {
      create: createMock
    }
  }
})

vi.mock('../models/ticket-status-history-model.js', () => {
  return {
    TicketStatusHistoryModel: {
      create: createHistoryMock
    }
  }
})

import { ReserveTicketUseCase } from './reserve-ticket-use-case.js'

describe('ReserveTicketUseCase', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)

    reserveIfAvailableMock.mockResolvedValue(undefined)
    createHistoryMock.mockResolvedValue(undefined)

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

  test('deve reservar tickets com sucesso', async () => {
    createMock
      .mockResolvedValueOnce({
        id: 1,
        customer_id: 10,
        ticket_id: 101,
        status: 'reserved'
      })
      .mockResolvedValueOnce({
        id: 2,
        customer_id: 10,
        ticket_id: 102,
        status: 'reserved'
      })

    const result = await ReserveTicketUseCase.execute({
      customer_id: 10,
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

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(createMock).toHaveBeenNthCalledWith(
      1,
      {
        customer_id: 10,
        ticket_id: 101,
        status: 'reserved',
        expires_at: expect.any(Date)
      },
      {
        connection: expect.any(Object)
      }
    )
    expect(createMock).toHaveBeenNthCalledWith(
      2,
      {
        customer_id: 10,
        ticket_id: 102,
        status: 'reserved',
        expires_at: expect.any(Date)
      },
      {
        connection: expect.any(Object)
      }
    )

    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(createHistoryMock).toHaveBeenNthCalledWith(
      1,
      {
        ticket_id: 101,
        from_status: 'available',
        to_status: 'reserved'
      },
      {
        connection: expect.any(Object)
      }
    )
    expect(createHistoryMock).toHaveBeenNthCalledWith(
      2,
      {
        ticket_id: 102,
        from_status: 'available',
        to_status: 'reserved'
      },
      {
        connection: expect.any(Object)
      }
    )

    expect(commitMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
    expect(result).toHaveLength(2)
  })

  test('deve lançar erro se customer_id não for informado', async () => {
    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 0,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Customer id is required')
  })

  test('deve lançar erro se não informar ticket_ids', async () => {
    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 10,
        ticket_ids: []
      })
    ).rejects.toThrow('At least one ticket id is required')
  })

  test('deve fazer rollback se o ticket não estiver disponível', async () => {
    reserveIfAvailableMock.mockRejectedValue(new Error('Ticket 101 is not available'))

    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 10,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Ticket 101 is not available')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se create lançar erro', async () => {
    createMock.mockRejectedValue(new Error('Database error'))

    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 10,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Database error')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se create do histórico lançar erro', async () => {
    createMock.mockResolvedValue({
      id: 1,
      customer_id: 10,
      ticket_id: 101,
      status: 'reserved'
    })

    createHistoryMock.mockRejectedValue(new Error('Database error'))

    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 10,
        ticket_ids: [101]
      })
    ).rejects.toThrow('Database error')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve impedir reserva simultânea quando reserveIfAvailable falhar na segunda tentativa', async () => {
    reserveIfAvailableMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Ticket 102 is not available'))

    await expect(
      ReserveTicketUseCase.execute({
        customer_id: 10,
        ticket_ids: [101, 102]
      })
    ).rejects.toThrow('Ticket 102 is not available')

    expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(createMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })
})
