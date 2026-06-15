import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Purchase, PurchaseStatus } from '../../domain/entities/purchase.js'
import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { PurchaseRepository } from '../../domain/repositories/purchase-repository.js'
import { PurchaseTicketRepository } from '../../domain/repositories/purchase-ticket-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TicketStatusHistoryRepository } from '../../domain/repositories/ticket-status-history-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { CreatePurchaseUseCase } from './create-purchase-use-case.js'

describe('Application CreatePurchaseUseCase', () => {
  const scope: TransactionScope = { kind: 'transaction' }

  const ticketRepository: TicketRepository = {
    findByIds: vi.fn(),
    reserveIfAvailable: vi.fn(),
    sellIfAvailable: vi.fn(),
    releaseIfSold: vi.fn()
  }

  const purchaseRepository: PurchaseRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    markAsCancelled: vi.fn()
  }

  const purchaseTicketRepository: PurchaseTicketRepository = {
    create: vi.fn(),
    findByPurchaseId: vi.fn()
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

  const useCase = new CreatePurchaseUseCase({
    ticketRepository,
    purchaseRepository,
    purchaseTicketRepository,
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
    vi.mocked(ticketRepository.sellIfAvailable).mockResolvedValue(undefined)
    vi.mocked(purchaseTicketRepository.create).mockResolvedValue({
      id: 1,
      purchaseId: 10,
      ticketId: 1
    })
    vi.mocked(ticketStatusHistoryRepository.create).mockResolvedValue(undefined)
    vi.mocked(auditLogRepository.create).mockResolvedValue(undefined)

    const purchaseDate = new Date('2027-06-15T12:00:00.000Z')

    vi.mocked(purchaseRepository.create).mockResolvedValue(
      new Purchase(10, 5, purchaseDate, 200, PurchaseStatus.paid)
    )
  })

  it('deve comprar tickets usando apenas interfaces de repositório', async () => {
    const result = await useCase.execute({
      customerId: 5,
      userId: 10,
      ticketIds: [1, 2]
    })

    expect(result.id).toBe(10)
    expect(ticketRepository.findByIds).toHaveBeenCalledWith([1, 2], {
      scope,
      forUpdate: true
    })
    expect(ticketRepository.sellIfAvailable).toHaveBeenCalledTimes(2)
    expect(purchaseRepository.create).toHaveBeenCalledWith(
      {
        customerId: 5,
        totalAmount: 200,
        status: PurchaseStatus.paid
      },
      { scope }
    )
    expect(purchaseTicketRepository.create).toHaveBeenCalledTimes(2)
    expect(ticketStatusHistoryRepository.create).toHaveBeenCalledTimes(2)
    expect(auditLogRepository.create).toHaveBeenCalledWith(
      {
        userId: 10,
        action: AuditAction.PURCHASE_CREATED,
        entityType: AuditEntityType.purchase,
        entityId: 10,
        newData: {
          customer_id: 5,
          ticket_ids: [1, 2],
          total_amount: 200,
          status: PurchaseStatus.paid
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

  it('deve lançar erro quando ticket não for encontrado', async () => {
    vi.mocked(ticketRepository.findByIds).mockResolvedValue([
      new Ticket(1, 10, 'A1', 100, TicketStatus.available, new Date())
    ])

    await expect(
      useCase.execute({
        customerId: 5,
        userId: 10,
        ticketIds: [1, 2]
      })
    ).rejects.toThrow('Some tickets not found')

    expect(ticketRepository.sellIfAvailable).not.toHaveBeenCalled()
  })

  it('deve propagar erro de indisponibilidade do repositório de tickets', async () => {
    vi.mocked(ticketRepository.findByIds).mockResolvedValue([
      new Ticket(1, 10, 'A1', 100, TicketStatus.available, new Date())
    ])
    vi.mocked(ticketRepository.sellIfAvailable).mockRejectedValue(
      new Error('Ticket 1 is not available')
    )

    await expect(
      useCase.execute({
        customerId: 5,
        userId: 10,
        ticketIds: [1]
      })
    ).rejects.toThrow('Ticket 1 is not available')

    expect(purchaseRepository.create).not.toHaveBeenCalled()
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
