import { Reservation, ReservationStatus } from '../../domain/entities/reservation.js'
import { TicketStatus } from '../../domain/entities/ticket.js'
import { ReservationValidationError } from '../../domain/errors/reservation-errors.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { ReservationRepository } from '../../domain/repositories/reservation-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TicketStatusHistoryRepository } from '../../domain/repositories/ticket-status-history-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'

export interface CreateReservationInput {
  customerId: number
  userId: number
  ticketIds: number[]
}

export interface CreateReservationDependencies {
  ticketRepository: TicketRepository
  reservationRepository: ReservationRepository
  ticketStatusHistoryRepository: TicketStatusHistoryRepository
  auditLogRepository: AuditLogRepository
  transactionManager: TransactionManager
}

export class CreateReservationUseCase {
  constructor(private readonly dependencies: CreateReservationDependencies) {}

  async execute(input: CreateReservationInput): Promise<Reservation[]> {
    if (!input.ticketIds || input.ticketIds.length === 0) {
      throw new ReservationValidationError('ticket_ids is required')
    }

    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const tickets = await this.dependencies.ticketRepository.findByIds(input.ticketIds, {
        scope,
        forUpdate: true
      })

      if (tickets.length !== input.ticketIds.length) {
        throw new Error('Some tickets not found')
      }

      const reservations: Reservation[] = []

      for (const ticketId of input.ticketIds) {
        await this.dependencies.ticketRepository.reserveIfAvailable(ticketId, { scope })

        await this.dependencies.ticketStatusHistoryRepository.create(
          {
            ticketId,
            fromStatus: TicketStatus.available,
            toStatus: TicketStatus.reserved
          },
          { scope }
        )

        const reservation = await this.dependencies.reservationRepository.create(
          {
            customerId: input.customerId,
            ticketId,
            status: ReservationStatus.reserved
          },
          { scope }
        )

        reservations.push(reservation)
      }

      await this.dependencies.auditLogRepository.create(
        {
          userId: input.userId,
          action: AuditAction.TICKETS_RESERVED,
          entityType: AuditEntityType.reservation,
          entityId: reservations[0]?.id ?? null,
          newData: {
            customer_id: input.customerId,
            ticket_ids: input.ticketIds,
            reservation_ids: reservations.map((reservation) => reservation.id),
            status: ReservationStatus.reserved
          }
        },
        { scope }
      )

      return reservations
    })
  }
}
