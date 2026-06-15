import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { CreateReservationUseCase } from './create-reservation-use-case.js'

describe('CreateReservationUseCase', () => {
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
  const findAllMock = vi.spyOn(TicketModel, 'findAll')
  const reserveIfAvailableMock = vi.spyOn(TicketModel, 'reserveIfAvailable')
  const createHistoryMock = vi.spyOn(TicketStatusHistoryModel, 'create')
  const createReservationMock = vi.spyOn(ReservationTicketModel, 'create')
  const createAuditLogMock = vi.spyOn(AuditLogModel, 'create')

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

    findAllMock.mockResolvedValue([
      { id: 1, status: TicketStatus.available },
      { id: 2, status: TicketStatus.available }
    ] as never)
    reserveIfAvailableMock.mockResolvedValue(undefined)
    createHistoryMock.mockResolvedValue({} as never)
    createReservationMock.mockResolvedValue({ id: 1 } as never)
    createAuditLogMock.mockResolvedValue({} as never)
  })

  it('deve reservar tickets disponíveis com sucesso', async () => {
    const result = await CreateReservationUseCase.execute({
      customer_id: 1,
      user_id: 10,
      ticket_ids: [1, 2]
    })

    expect(result).toHaveLength(2)
    expect(findAllMock).toHaveBeenCalledWith(
      { where: { ids: [1, 2] } },
      { connection, forUpdate: true }
    )
    expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(1, 1, { connection })
    expect(reserveIfAvailableMock).toHaveBeenNthCalledWith(2, 2, { connection })
    expect(createHistoryMock).toHaveBeenCalledTimes(2)
    expect(createReservationMock).toHaveBeenCalledTimes(2)
    expect(createAuditLogMock).toHaveBeenCalledWith(
      {
        user_id: 10,
        action: AuditAction.TICKETS_RESERVED,
        entity_type: AuditEntityType.reservation,
        entity_id: 1,
        old_data: null,
        new_data: {
          customer_id: 1,
          ticket_ids: [1, 2],
          reservation_ids: [1, 1],
          status: ReservationStatus.reserved
        }
      },
      { connection }
    )
    expect(commitMock).toHaveBeenCalled()
    expect(rollbackMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  it('deve lançar erro se ticket_ids estiver vazio', async () => {
    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: []
      })
    ).rejects.toThrow('ticket_ids is required')
  })

  it('deve lançar erro se ticket não for encontrado', async () => {
    findAllMock.mockResolvedValue([])

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1]
      })
    ).rejects.toThrow('Some tickets not found')

    expect(reserveIfAvailableMock).not.toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
  })

  it('deve lançar erro se ticket não estiver disponível', async () => {
    findAllMock.mockResolvedValue([{ id: 1, status: TicketStatus.available }] as never)
    reserveIfAvailableMock.mockRejectedValue(new Error('Ticket 1 is not available'))

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1]
      })
    ).rejects.toThrow('Ticket 1 is not available')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback em erro de banco', async () => {
    findAllMock.mockRejectedValue(new Error('DB error'))

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1]
      })
    ).rejects.toThrow('DB error')

    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalled()
  })

  it('deve impedir reserva simultânea quando reserveIfAvailable falhar na segunda tentativa', async () => {
    findAllMock.mockResolvedValue([
      { id: 1, status: TicketStatus.available },
      { id: 2, status: TicketStatus.available }
    ] as never)

    reserveIfAvailableMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Ticket 2 is not available'))

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Ticket 2 is not available')

    expect(reserveIfAvailableMock).toHaveBeenCalledTimes(2)
    expect(createReservationMock).toHaveBeenCalledTimes(1)
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('deve fazer rollback se audit log falhar', async () => {
    createAuditLogMock.mockRejectedValue(new Error('Audit log failed'))

    await expect(
      CreateReservationUseCase.execute({
        customer_id: 1,
        user_id: 10,
        ticket_ids: [1, 2]
      })
    ).rejects.toThrow('Audit log failed')

    expect(createAuditLogMock).toHaveBeenCalled()
    expect(rollbackMock).toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })
})
