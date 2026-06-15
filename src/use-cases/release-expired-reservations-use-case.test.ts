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
  const releaseIfReservedMock = vi.spyOn(TicketModel, 'releaseIfReserved')
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
    releaseIfReservedMock.mockResolvedValue(true)
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
      { connection, forUpdate: true }
    )

    expect(releaseIfReservedMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
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

  it('deve liberar múltiplas reservas expiradas com sucesso', async () => {
    const expiredReservations = [
      { id: 1, ticket_id: 10, status: ReservationStatus.reserved },
      { id: 2, ticket_id: 20, status: ReservationStatus.reserved }
    ] as ReservationTicketModel[]

    findReservationsMock.mockResolvedValue(expiredReservations)

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(result).toBe(2)
    expect(releaseIfReservedMock).toHaveBeenCalledTimes(2)
    expect(releaseIfReservedMock).toHaveBeenNthCalledWith(1, 10, { connection })
    expect(releaseIfReservedMock).toHaveBeenNthCalledWith(2, 20, { connection })
    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(markAsCancelledMock).toHaveBeenCalledTimes(2)
    expect(markAsCancelledMock).toHaveBeenNthCalledWith(1, 1, { connection })
    expect(markAsCancelledMock).toHaveBeenNthCalledWith(2, 2, { connection })
    expect(commitMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).not.toHaveBeenCalled()
  })

  it('deve retornar 0 quando não houver reservas expiradas', async () => {
    findReservationsMock.mockResolvedValue([])

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(result).toBe(0)
    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(releaseIfReservedMock).not.toHaveBeenCalled()
    expect(createHistoryMock).not.toHaveBeenCalled()
    expect(markAsCancelledMock).not.toHaveBeenCalled()
    expect(commitMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('deve cancelar reserva sem registrar histórico quando ticket já estiver disponível', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])
    releaseIfReservedMock.mockResolvedValue(false)

    const result = await ReleaseExpiredReservationsUseCase.execute()

    expect(result).toBe(1)
    expect(releaseIfReservedMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
      connection
    })
    expect(createHistoryMock).not.toHaveBeenCalled()
    expect(markAsCancelledMock).toHaveBeenCalledWith(expiredReservation.id, {
      connection
    })
    expect(commitMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback se ocorrer erro ao liberar ticket', async () => {
    const expiredReservation = {
      id: 1,
      ticket_id: 10,
      status: ReservationStatus.reserved
    } as ReservationTicketModel

    findReservationsMock.mockResolvedValue([expiredReservation])
    releaseIfReservedMock.mockRejectedValue(new Error('Ticket release failed'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'Ticket release failed'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(releaseIfReservedMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
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
    expect(releaseIfReservedMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
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
    markAsCancelledMock.mockRejectedValue(new Error('Reservation not found'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'Reservation not found'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(releaseIfReservedMock).toHaveBeenCalledWith(expiredReservation.ticket_id, {
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

  it('deve fazer rollback e liberar conexão em erro de banco ao buscar reservas', async () => {
    findReservationsMock.mockRejectedValue(new Error('DB connection failed'))

    await expect(ReleaseExpiredReservationsUseCase.execute()).rejects.toThrow(
      'DB connection failed'
    )

    expect(beginTransactionMock).toHaveBeenCalledTimes(1)
    expect(findReservationsMock).toHaveBeenCalled()
    expect(releaseIfReservedMock).not.toHaveBeenCalled()
    expect(createHistoryMock).not.toHaveBeenCalled()
    expect(markAsCancelledMock).not.toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })
})
