import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import { EventNotFoundError } from '../../domain/errors/ticket-errors.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'

export interface CreateTicketsInput {
  eventId: number
  numTickets: number
  price: number
  userId: number
}

export interface CreateTicketsDependencies {
  eventRepository: EventRepository
  ticketRepository: TicketRepository
  auditLogRepository: AuditLogRepository
  transactionManager: TransactionManager
}

export class CreateTicketsUseCase {
  constructor(private readonly dependencies: CreateTicketsDependencies) {}

  async execute(input: CreateTicketsInput): Promise<Ticket[]> {
    const event = await this.dependencies.eventRepository.findById(input.eventId)

    if (!event) {
      throw new EventNotFoundError()
    }

    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const ticketsData = Array.from({ length: input.numTickets }, (_, index) => ({
        location: `Location ${index}`,
        eventId: event.id,
        price: input.price,
        status: TicketStatus.available
      }))

      const tickets = await this.dependencies.ticketRepository.createMany(ticketsData, { scope })

      await this.dependencies.auditLogRepository.create(
        {
          userId: input.userId,
          action: AuditAction.TICKETS_CREATED,
          entityType: AuditEntityType.ticket,
          entityId: event.id,
          newData: {
            event_id: event.id,
            ticket_ids: tickets.map((ticket) => ticket.id),
            quantity: tickets.length,
            price: input.price,
            status: TicketStatus.available
          }
        },
        { scope }
      )

      return tickets
    })
  }
}
