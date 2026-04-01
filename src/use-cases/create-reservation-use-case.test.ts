import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { CreateReservationUseCase } from './create-reservation-use-case.js'

vi.mock('../database.js', () => ({
  Database: {
    getInstance: vi.fn()
  }
}))

vi.mock('../models/ticket-model.js', () => ({
  TicketModel: {
    findAll: vi.fn(),
    markAsReserved: vi.fn()
  },
  TicketStatus: {
    available: 'available',
    reserved: 'reserved'
  }
}))

vi.mock('../models/reservation-ticket-model.js', () => ({
  ReservationTicketModel: {
    create: vi.fn()
  },
  ReservationStatus: {
    reserved: 'reserved'
  }
}))

vi.mock('../models/ticket-status-history-model.js', () => ({
  TicketStatusHistoryModel: {
    create: vi.fn()
  }
}))

describe('CreateReservationUseCase', () => {
  const mockConnection = {
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(
      Database.getInstance as unknown as { mockReturnValue: (value: unknown) => void }
    ).mockReturnValue({
      getConnection: vi.fn().mockResolvedValue(mockConnection)
    })
    ;(
      TicketModel.markAsReserved as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue(undefined)
    ;(
      TicketStatusHistoryModel.create as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue(undefined)
  })

  it('should create reservation successfully', async () => {
    ;(
      TicketModel.findAll as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue([
      { id: 1, status: TicketStatus.available },
      { id: 2, status: TicketStatus.available }
    ])
    ;(
      ReservationTicketModel.create as unknown as {
        mockResolvedValueOnce: (value: unknown) => {
          mockResolvedValueOnce: (value: unknown) => void
        }
      }
    )
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 })

    const result = await CreateReservationUseCase.execute({
      customer_id: 1,
      ticket_ids: [1, 2]
    })

    expect(result).toHaveLength(2)
    expect(mockConnection.commit).toHaveBeenCalled()
    expect(mockConnection.rollback).not.toHaveBeenCalled()
  })

  it('should throw error if ticket_ids is empty', async () => {
    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        ticket_ids: []
      })
    ).rejects.toThrow('ticket_ids is required')
  })

  it('should throw error if ticket not found', async () => {
    ;(
      TicketModel.findAll as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue([])

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow('Some tickets not found')
  })

  it('should throw error if ticket not available', async () => {
    ;(
      TicketModel.findAll as unknown as { mockResolvedValue: (value: unknown) => void }
    ).mockResolvedValue([{ id: 1, status: TicketStatus.reserved }])

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow('not available')
  })

  it('should rollback on error', async () => {
    ;(
      TicketModel.findAll as unknown as { mockRejectedValue: (value: unknown) => void }
    ).mockRejectedValue(new Error('DB error'))

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        ticket_ids: [1]
      })
    ).rejects.toThrow()

    expect(mockConnection.rollback).toHaveBeenCalled()
    expect(mockConnection.commit).not.toHaveBeenCalled()
  })
})
