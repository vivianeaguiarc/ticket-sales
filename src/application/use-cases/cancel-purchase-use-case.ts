import { PurchaseStatus } from '../../domain/entities/purchase.js'
import { TicketStatus } from '../../domain/entities/ticket.js'
import {
  PurchaseAlreadyCancelledError,
  PurchaseNotFoundError,
  PurchaseTicketsNotFoundError,
  PurchaseValidationError
} from '../../domain/errors/purchase-errors.js'
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

export interface CancelPurchaseInput {
  purchaseId: number
  userId: number
}

export interface CancelPurchaseDependencies {
  purchaseRepository: PurchaseRepository
  purchaseTicketRepository: PurchaseTicketRepository
  ticketRepository: TicketRepository
  ticketStatusHistoryRepository: TicketStatusHistoryRepository
  reservationRepository: ReservationRepository
  auditLogRepository: AuditLogRepository
  transactionManager: TransactionManager
}

export class CancelPurchaseUseCase {
  constructor(private readonly dependencies: CancelPurchaseDependencies) {}

  async execute(input: CancelPurchaseInput): Promise<void> {
    if (!input.purchaseId) {
      throw new PurchaseValidationError('Purchase id is required')
    }

    await this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const purchase = await this.dependencies.purchaseRepository.findById(input.purchaseId, {
        scope,
        forUpdate: true
      })

      if (!purchase) {
        throw new PurchaseNotFoundError()
      }

      if (purchase.status === PurchaseStatus.cancelled) {
        throw new PurchaseAlreadyCancelledError()
      }

      const purchaseTickets = await this.dependencies.purchaseTicketRepository.findByPurchaseId(
        input.purchaseId,
        { scope }
      )

      if (purchaseTickets.length === 0) {
        throw new PurchaseTicketsNotFoundError()
      }

      const ticketIds = purchaseTickets.map((purchaseTicket) => purchaseTicket.ticketId)

      for (const ticketId of ticketIds) {
        const released = await this.dependencies.ticketRepository.releaseIfSold(ticketId, {
          scope
        })

        if (released) {
          await this.dependencies.ticketStatusHistoryRepository.create(
            {
              ticketId,
              fromStatus: TicketStatus.sold,
              toStatus: TicketStatus.available
            },
            { scope }
          )
        }
      }

      const reservations =
        await this.dependencies.reservationRepository.findReservedByCustomerAndTickets(
          purchase.customerId,
          ticketIds,
          { scope }
        )

      for (const reservation of reservations) {
        await this.dependencies.reservationRepository.markAsCancelled(reservation.id, { scope })
      }

      await this.dependencies.purchaseRepository.markAsCancelled(input.purchaseId, { scope })

      await this.dependencies.auditLogRepository.create(
        {
          userId: input.userId,
          action: AuditAction.PURCHASE_CANCELLED,
          entityType: AuditEntityType.purchase,
          entityId: purchase.id,
          oldData: {
            status: PurchaseStatus.paid,
            customer_id: purchase.customerId,
            ticket_ids: ticketIds
          },
          newData: {
            status: PurchaseStatus.cancelled,
            customer_id: purchase.customerId,
            ticket_ids: ticketIds
          }
        },
        { scope }
      )
    })
  }
}
