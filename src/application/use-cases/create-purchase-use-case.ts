import { Purchase, PurchaseStatus } from '../../domain/entities/purchase.js'
import { TicketStatus } from '../../domain/entities/ticket.js'
import {
  PurchaseValidationError,
  TicketNotFoundError
} from '../../domain/errors/purchase-errors.js'
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

export interface CreatePurchaseInput {
  customerId: number
  userId: number
  ticketIds: number[]
}

export interface CreatePurchaseDependencies {
  ticketRepository: TicketRepository
  purchaseRepository: PurchaseRepository
  purchaseTicketRepository: PurchaseTicketRepository
  ticketStatusHistoryRepository: TicketStatusHistoryRepository
  auditLogRepository: AuditLogRepository
  transactionManager: TransactionManager
}

export class CreatePurchaseUseCase {
  constructor(private readonly dependencies: CreatePurchaseDependencies) {}

  async execute(input: CreatePurchaseInput): Promise<Purchase> {
    if (!input.ticketIds || input.ticketIds.length === 0) {
      throw new PurchaseValidationError('ticket_ids is required')
    }

    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const tickets = await this.dependencies.ticketRepository.findByIds(input.ticketIds, {
        scope,
        forUpdate: true
      })

      if (tickets.length !== input.ticketIds.length) {
        throw new TicketNotFoundError('Some tickets not found')
      }

      for (const ticket of tickets) {
        await this.dependencies.ticketRepository.sellIfAvailable(ticket.id, { scope })
      }

      const totalAmount = tickets.reduce((total, ticket) => total + Number(ticket.price), 0)

      const purchase = await this.dependencies.purchaseRepository.create(
        {
          customerId: input.customerId,
          totalAmount,
          status: PurchaseStatus.paid
        },
        { scope }
      )

      for (const ticket of tickets) {
        await this.dependencies.purchaseTicketRepository.create(
          {
            purchaseId: purchase.id,
            ticketId: ticket.id
          },
          { scope }
        )

        await this.dependencies.ticketStatusHistoryRepository.create(
          {
            ticketId: ticket.id,
            fromStatus: TicketStatus.available,
            toStatus: TicketStatus.sold
          },
          { scope }
        )
      }

      await this.dependencies.auditLogRepository.create(
        {
          userId: input.userId,
          action: AuditAction.PURCHASE_CREATED,
          entityType: AuditEntityType.purchase,
          entityId: purchase.id,
          newData: {
            customer_id: input.customerId,
            ticket_ids: tickets.map((ticket) => ticket.id),
            total_amount: totalAmount,
            status: PurchaseStatus.paid
          }
        },
        { scope }
      )

      return purchase
    })
  }
}
