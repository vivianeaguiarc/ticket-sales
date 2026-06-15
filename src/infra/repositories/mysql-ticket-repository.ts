import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
  InvalidTicketStatusTransitionError,
  TicketNotFoundError,
  TicketUnavailableError
} from '../../domain/errors/ticket-errors.js'
import {
  CreateTicketData,
  RepositoryQueryOptions,
  TicketRepository
} from '../../domain/repositories/ticket-repository.js'
import { TicketModel } from '../../models/ticket-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainTicket(model: TicketModel): Ticket {
  return new Ticket(
    model.id,
    model.event_id,
    model.location,
    model.price,
    model.status as TicketStatus,
    model.created_at
  )
}

function mapTicketMutationError(error: unknown, ticketId: number): never {
  if (error instanceof Error) {
    if (error.message === 'Ticket not found') {
      throw new TicketNotFoundError()
    }

    if (error.message === `Ticket ${ticketId} is not available`) {
      throw new TicketUnavailableError(ticketId)
    }

    if (error.message === 'Ticket is not reserved' || error.message.includes('is not available')) {
      throw new InvalidTicketStatusTransitionError(error.message)
    }
  }

  throw error
}

export class MysqlTicketRepository implements TicketRepository {
  async findById(ticketId: number, options?: RepositoryQueryOptions): Promise<Ticket | null> {
    const connection = resolveMysqlConnection(options?.scope)
    const ticket = await TicketModel.findById(ticketId, { connection })

    return ticket ? toDomainTicket(ticket) : null
  }

  async findByIds(ticketIds: number[], options?: RepositoryQueryOptions): Promise<Ticket[]> {
    const connection = resolveMysqlConnection(options?.scope)
    const tickets = await TicketModel.findAll(
      { where: { ids: ticketIds } },
      { connection, forUpdate: options?.forUpdate }
    )

    return tickets.map(toDomainTicket)
  }

  async findByEventId(eventId: number, options?: RepositoryQueryOptions): Promise<Ticket[]> {
    const connection = resolveMysqlConnection(options?.scope)
    const tickets = await TicketModel.findAll({ where: { event_id: eventId } }, { connection })

    return tickets.map(toDomainTicket)
  }

  async createMany(data: CreateTicketData[], options?: RepositoryQueryOptions): Promise<Ticket[]> {
    const connection = resolveMysqlConnection(options?.scope)
    const tickets = await TicketModel.createMany(
      data.map((ticket) => ({
        location: ticket.location,
        event_id: ticket.eventId,
        price: ticket.price,
        status: ticket.status
      })),
      { connection }
    )

    return tickets.map(toDomainTicket)
  }

  async reserveIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    try {
      await TicketModel.reserveIfAvailable(ticketId, { connection })
    } catch (error) {
      mapTicketMutationError(error, ticketId)
    }
  }

  async sellIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    try {
      await TicketModel.sellIfAvailable(ticketId, { connection })
    } catch (error) {
      mapTicketMutationError(error, ticketId)
    }
  }

  async markAsSold(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    try {
      await TicketModel.markAsSold(ticketId, { connection })
    } catch (error) {
      mapTicketMutationError(error, ticketId)
    }
  }

  async markAsAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    try {
      await TicketModel.markAsAvailable(ticketId, { connection })
    } catch (error) {
      mapTicketMutationError(error, ticketId)
    }
  }

  async releaseIfSold(ticketId: number, options?: RepositoryQueryOptions): Promise<boolean> {
    const connection = resolveMysqlConnection(options?.scope)

    return TicketModel.releaseIfSold(ticketId, { connection })
  }
}
