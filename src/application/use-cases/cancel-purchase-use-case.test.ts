import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Purchase, PurchaseStatus } from '../../domain/entities/purchase.js'
import { PurchaseTicket } from '../../domain/entities/purchase-ticket.js'
import { Reservation, ReservationStatus } from '../../domain/entities/reservation.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { PurchaseRepository } from '../../domain/repositories/purchase-repository.js'
import { PurchaseTicketRepository } from '../../domain/repositories/purchase-ticket-repository.js'
import { ReservationRepository } from '../../domain/repositories/reservation-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TicketStatusHistoryRepository } from '../../domain/repositories/ticket-status-history-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { CancelPurchaseUseCase } from './cancel-purchase-use-case.js'

describe('Application CancelPurchaseUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }
  const purchaseDate = new Date('2027-06-15T12:00:00.000Z')

  const purchaseRepository: PurchaseRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    markAsCancelled: vi.fn()
  }

  const purchaseTicketRepository: PurchaseTicketRepository = {
    create: vi.fn(),
    findByPurchaseId: vi.fn()
  }

  const ticketRepository: TicketRepository = {
    findByIds: vi.fn(),
    reserveIfAvailable: vi.fn(),
    sellIfAvailable: vi.fn(),
    releaseIfSold: vi.fn()
  }

  const ticketStatusHistoryRepository: TicketStatusHistoryRepository = {
    create: vi.fn()
  }

  const reservationRepository: ReservationRepository = {
    create: vi.fn(),
    findReservedByCustomerAndTickets: vi.fn(),
    markAsCancelled: vi.fn()
  }

  const auditLogRepository: AuditLogRepository = {
    create: vi.fn()
  }

  const transactionManager: TransactionManager = {
    runInTransaction: vi.fn(async (work) => work(scope))
  }

  const useCase = new CancelPurchaseUseCase({
    purchaseRepository,
    purchaseTicketRepository,
    ticketRepository,
    ticketStatusHistoryRepository,
    reservationRepository,
    auditLogRepository,
    transactionManager
  })

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(purchaseRepository.findById).mockResolvedValue(
      new Purchase(10, 1, purchaseDate, 200, PurchaseStatus.paid)
    )
    vi.mocked(purchaseTicketRepository.findByPurchaseId).mockResolvedValue([
      new PurchaseTicket(1, 10, 101),
      new PurchaseTicket(2, 10, 102)
    ])
    vi.mocked(ticketRepository.releaseIfSold).mockResolvedValue(true)
    vi.mocked(ticketStatusHistoryRepository.create).mockResolvedValue(undefined)
    vi.mocked(reservationRepository.findReservedByCustomerAndTickets).mockResolvedValue([
      new Reservation(5, 1, 101, purchaseDate, purchaseDate, ReservationStatus.reserved)
    ])
    vi.mocked(reservationRepository.markAsCancelled).mockResolvedValue(undefined)
    vi.mocked(purchaseRepository.markAsCancelled).mockResolvedValue(undefined)
    vi.mocked(auditLogRepository.create).mockResolvedValue(undefined)
  })

  it('deve cancelar compra usando apenas interfaces de repositório', async () => {
    await useCase.execute({ purchaseId: 10, userId: 5 })

    expect(purchaseRepository.findById).toHaveBeenCalledWith(10, {
      scope,
      forUpdate: true
    })
    expect(purchaseTicketRepository.findByPurchaseId).toHaveBeenCalledWith(10, { scope })
    expect(ticketRepository.releaseIfSold).toHaveBeenCalledTimes(2)
    expect(ticketStatusHistoryRepository.create).toHaveBeenCalledTimes(2)
    expect(reservationRepository.findReservedByCustomerAndTickets).toHaveBeenCalledWith(
      1,
      [101, 102],
      { scope }
    )
    expect(reservationRepository.markAsCancelled).toHaveBeenCalledWith(5, { scope })
    expect(purchaseRepository.markAsCancelled).toHaveBeenCalledWith(10, { scope })
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      {
        userId: 5,
        action: AuditAction.PURCHASE_CANCELLED,
        entityType: AuditEntityType.purchase,
        entityId: 10,
        oldData: {
          status: PurchaseStatus.paid,
          customer_id: 1,
          ticket_ids: [101, 102]
        },
        newData: {
          status: PurchaseStatus.cancelled,
          customer_id: 1,
          ticket_ids: [101, 102]
        }
      },
      { scope }
    )
  })

  it('deve lançar erro se purchase_id não for informado', async () => {
    await expect(useCase.execute({ purchaseId: 0, userId: 5 })).rejects.toThrow(
      'Purchase id is required'
    )
  })

  it('deve lançar erro se purchase não for encontrada', async () => {
    vi.mocked(purchaseRepository.findById).mockResolvedValue(null)

    await expect(useCase.execute({ purchaseId: 10, userId: 5 })).rejects.toThrow(
      'Purchase not found'
    )
  })

  it('deve lançar erro se purchase já estiver cancelada', async () => {
    vi.mocked(purchaseRepository.findById).mockResolvedValue(
      new Purchase(10, 1, purchaseDate, 200, PurchaseStatus.cancelled)
    )

    await expect(useCase.execute({ purchaseId: 10, userId: 5 })).rejects.toThrow(
      'Purchase already cancelled'
    )

    expect(purchaseTicketRepository.findByPurchaseId).not.toHaveBeenCalled()
  })

  it('deve lançar erro se purchase tickets não forem encontrados', async () => {
    vi.mocked(purchaseTicketRepository.findByPurchaseId).mockResolvedValue([])

    await expect(useCase.execute({ purchaseId: 10, userId: 5 })).rejects.toThrow(
      'Purchase tickets not found'
    )
  })
})
