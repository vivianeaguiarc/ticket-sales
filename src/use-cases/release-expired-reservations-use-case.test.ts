import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { ReleaseExpiredReservationsUseCase } from './release-expired-reservations-use-case.js'

describe('ReleaseExpiredReservationsUseCase', () => {
  const beginTransactionMock = vi.fn()
  const commitMock = vi.fn()
  const rollbackMock = vi.fn()
  const releaseMock = vi.fn()

  const connection = {
    beginTransaction: beginTransactionMock,
    commit: commitMock,
    rollback: rollbackMock,
    release: releaseMock
  }

  const getConnectionMock = vi.fn()

  const findReservationsMock = vi.spyOn(ReservationTicketModel, 'findAll')
  const markAsAvailableMock = vi.spyOn(TicketModel, 'markAsAvailable')
  const createHistoryMock = vi.spyOn(TicketStatusHistoryModel, 'create')
  const markAsCancelledMock = vi.spyOn(ReservationTicketModel, 'markAsCancelled')

  beforeEach(() => {
    vi.clearAllMocks()

    beginTransactionMock.mockResolvedValue(undefined)
    commitMock.mockResolvedValue(undefined)
    rollbackMock.mockResolvedValue(undefined)
    releaseMock.mockResolvedValue(undefined)

    getConnectionMock.mockResolvedValue(connection)

    vi.spyOn(Database, 'getInstance').mockReturnValue({
      getConnection: getConnectionMock
    } as unknown as ReturnType<typeof Database.getInstance>)

    findReservationsMock.mockResolvedValue([])
    markAsAvailableMock.mockResolvedValue(undefined)
    createHistoryMock.mockResolvedValue({} as never)
    markAsCancelledMock.mockResolvedValue(undefined)
  })

  it('deve liberar reservas expiradas com sucesso', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(result).toBe(1)
    expect(beginTransactionMock).toHaveBeenCalledTimes(1)

    expect(findReservationsMock).toHaveBeenCalledWith(
      {
        where: {
          status: ReservationStatus.reserved,
          expires_at: expect.any(Date)
        }
      },
      { connection }
    )

    expect(markAsAvailableMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
      connection
    })

    expect(createHistoryMock).toHaveBeenCalledWith(
      {
        ticket_id: expiredReservation.ticket_id,
        from_status: TicketStatus.reserved,
        to_status: TicketStatus.available
      },
      { connection }
    )

    expect(markAsCancelledMock).toHaveBeenCalledWith(expiredReservation.id, {
      connection
    })

    expect(commitMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('deve retornar 0 quando não houver reservas expiradas', async () => {
    findReservationsMock.mockResolvedValue([])

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(result).toBe(0)
    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(markAsAvailableMock).not.toHaveBeenCalled()
    expect(createHistoryMock).not.toHaveBeenCalled()
    expect(markAsCancelledMock).not.toHaveBeenCalled()
    expect(commitMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('deve fazer rollback se ocorrer erro ao liberar ticket', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])
    markAsAvailableMock.mockRejectedValue(new Error('Ticket release failed'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'Ticket release failed'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(markAsAvailableMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
      connection
    })
    expect(createHistoryMock).not.toHaveBeenCalled()
    expect(markAsCancelledMock).not.toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('deve fazer rollback se ocorrer erro ao salvar histórico', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])
    createHistoryMock.mockRejectedValue(new Error('History creation failed'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'History creation failed'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(markAsAvailableMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
      connection
    })
    expect(createHistoryMock).toHaveBeenCalledWith(
      {
        ticket_id: expiredReservation.ticket_id,
        from_status: TicketStatus.reserved,
        to_status: TicketStatus.available
      },
      { connection }
    )
    expect(markAsCancelledMock).not.toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('deve fazer rollback se ocorrer erro ao atualizar reserva', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])
    markAsCancelledMock.mockRejectedValue(new Error('Reservation update failed'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'Reservation update failed'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(markAsAvailableMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
      connection
    })
    expect(createHistoryMock).toHaveBeenCalledWith(
      {
        ticket_id: expiredReservation.ticket_id,
        from_status: TicketStatus.reserved,
        to_status: TicketStatus.available
      },
      { connection }
    )
    expect(markAsCancelledMock).toHaveBeenCalledWith(expiredReservation.id, {
      connection
    })
    expect(commitMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })
})
