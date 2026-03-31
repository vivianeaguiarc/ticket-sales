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
  createHistoryMock,
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
    createHistoryMock: vi.fn(),
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

vi.mock('../models/reservation-ticket-model.js', () => {
  return {
    ReservationStatus: {
      reserved: 'reserved',
      cancelled: 'cancelled'
    },
    ReservationTicketModel: {
      findAll: findAllMock
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
      markAsAvailable: markAsAvailableMock
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

import { ReleaseExpiredReservationsUseCase } from './release-expired-reservations-use-case.js'

describe('ReleaseExpiredReservationsUseCase', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)
    markAsAvailableMock.mockResolvedValue(undefined)
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

  test('deve liberar reservas expiradas com sucesso', async () => {
    const reservation1 = {
      id: 1,
      ticket_id: 101,
      delete: deleteMock
    }

    const reservation2 = {
      id: 2,
      ticket_id: 102,
      delete: deleteMock
    }

    findAllMock.mockResolvedValue([reservation1, reservation2])

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(findAllMock).toHaveBeenCalledWith(
      {
        where: {
          status: 'reserved',
          expires_before: expect.any(Date)
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

    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(createHistoryMock).toHaveBeenNthCalledWith(
      1,
      {
        ticket_id: 101,
        from_status: 'reserved',
        to_status: 'available'
      },
      {
        connection: expect.any(Object)
      }
    )
    expect(createHistoryMock).toHaveBeenNthCalledWith(
      2,
      {
        ticket_id: 102,
        from_status: 'reserved',
        to_status: 'available'
      },
      {
        connection: expect.any(Object)
      }
    )

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(commitMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
    expect(result).toBe(2)
  })

  test('deve retornar 0 quando não houver reservas expiradas', async () => {
    findAllMock.mockResolvedValue([])

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(commitMock).toHaveBeenCalled()
    expect(result).toBe(0)
  })

  test('deve fazer rollback se markAsAvailable falhar', async () => {
    const reservation = {
      id: 1,
      ticket_id: 101,
      delete: deleteMock
    }

    findAllMock.mockResolvedValue([reservation])
    markAsAvailableMock.mockRejectedValue(new Error('Ticket not found'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow('Ticket not found')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se criar histórico falhar', async () => {
    const reservation = {
      id: 1,
      ticket_id: 101,
      delete: deleteMock
    }

    findAllMock.mockResolvedValue([reservation])
    createHistoryMock.mockRejectedValue(new Error('Database error'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow('Database error')

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  test('deve fazer rollback se delete falhar', async () => {
    const reservation = {
      id: 1,
      ticket_id: 101,
      delete: vi.fn().mockRejectedValue(new Error('Reservation not found'))
    }

    findAllMock.mockResolvedValue([reservation])

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'Reservation not found'
    )

    expect(beginTransactionMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })
})
