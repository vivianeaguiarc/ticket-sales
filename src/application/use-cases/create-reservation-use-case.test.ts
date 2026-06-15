import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Reservation, ReservationStatus } from '../../domain/entities/reservation.js'
import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { ReservationRepository } from '../../domain/repositories/reservation-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TicketStatusHistoryRepository } from '../../domain/repositories/ticket-status-history-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { CreateReservationUseCase } from './create-reservation-use-case.js'

describe('Application CreateReservationUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }

  const ticketRepository: TicketRepository = {
    findByIds: vi.fn(),
    reserveIfAvailable: vi.fn()
  }

  const reservationRepository: ReservationRepository = {
    create: vi.fn()
  }

  const ticketStatusHistoryRepository: TicketStatusHistoryRepository = {
    create: vi.fn()
  }

  const auditLogRepository: AuditLogRepository = {
    create: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new CreateReservationUseCase({
    ticketRepository,
    reservationRepository,
    ticketStatusHistoryRepository,
    auditLogRepository,
    transactionManager
  })

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(ticketRepository.findByIds).mockResolvedValue([
      new Ticket(1, 10, 'A1', 100, TicketStatus.available, new Date()),
      new Ticket(2, 10, 'A2', 100, TicketStatus.available, new Date())
    ])
    vi.mocked(ticketRepository.reserveIfAvailable).mockResolvedValue(undefined)
    vi.mocked(ticketStatusHistoryRepository.create).mockResolvedValue(undefined)
    vi.mocked(auditLogRepository.create).mockResolvedValue(undefined)

    const expiresAt = new Date('2027-06-15T12:00:00.000Z')
    const reservationDate = new Date('2027-06-15T11:55:00.000Z')

    vi.mocked(reservationRepository.create)
      .mockResolvedValueOnce(
        new Reservation(1, 5, 1, reservationDate, expiresAt, ReservationStatus.reserved)
      )
      .mockResolvedValueOnce(
        new Reservation(2, 5, 2, reservationDate, expiresAt, ReservationStatus.reserved)
      )
  })

  it('deve reservar tickets usando apenas interfaces de repositório', async () => {
    const result = await useCase.execute({
      customerId: 5,
      userId: 10,
      ticketIds: [1, 2]
    })

    expect(result).toHaveLength(2)
    expect(ticketRepository.findByIds).toHaveBeenCalledWith([1, 2], {
      scope,
      forUpdate: true
    })
    expect(ticketRepository.reserveIfAvailable).toHaveBeenCalledTimes(2)
    expect(reservationRepository.create).toHaveBeenCalledTimes(2)
    expect(ticketStatusHistoryRepository.create).toHaveBeenCalledTimes(2)
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      {
        userId: 10,
        action: AuditAction.TICKETS_RESERVED,
        entityType: AuditEntityType.reservation,
        entityId: 1,
        newData: {
          customer_id: 5,
          ticket_ids: [1, 2],
          reservation_ids: [1, 2],
          status: ReservationStatus.reserved
        }
      },
      { scope }
    )
  })

  it('deve lançar erro quando ticket_ids estiver vazio', async () => {
    await expect(
      useCase.execute({
        customerId: 5,
        userId: 10,
        ticketIds: []
      })
    ).rejects.toThrow('ticket_ids is required')

    expect(transactionManager.runInTransaction).not.toHaveBeenCalled()
  })

  it('deve lançar erro quando algum ticket não for encontrado', async () => {
    vi.mocked(ticketRepository.findByIds).mockResolvedValue([])

    await expect(
      useCase.execute({
        customerId: 5,
        userId: 10,
        ticketIds: [1]
      })
    ).rejects.toThrow('Some tickets not found')

    expect(ticketRepository.reserveIfAvailable).not.toHaveBeenCalled()
  })

  it('deve propagar erro de indisponibilidade do repositório de tickets', async () => {
    vi.mocked(ticketRepository.findByIds).mockResolvedValue([
      new Ticket(1, 10, 'A1', 100, TicketStatus.available, new Date())
    ])
    vi.mocked(ticketRepository.reserveIfAvailable).mockRejectedValue(
      new Error('Ticket 1 is not available')
    )

    await expect(
      useCase.execute({
        customerId: 5,
        userId: 10,
        ticketIds: [1]
      })
    ).rejects.toThrow('Ticket 1 is not available')
  })

  it('deve executar dentro de uma transação', async () => {
    await useCase.execute({
      customerId: 5,
      userId: 10,
      ticketIds: [1, 2]
    })

    expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1)
  })
})
