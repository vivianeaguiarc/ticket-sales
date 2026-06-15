import { Ticket, TicketStatus } from '../../domain/entities/ticket.js'
import {
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

export class MysqlTicketRepository implements TicketRepository {
  async findByIds(ticketIds: number[], options?: RepositoryQueryOptions): Promise<Ticket[]> {
    const connection = resolveMysqlConnection(options?.scope)
    const tickets = await TicketModel.findAll(
      { where: { ids: ticketIds } },
      { connection, forUpdate: options?.forUpdate }
    )

    return tickets.map(toDomainTicket)
  }

  async reserveIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    await TicketModel.reserveIfAvailable(ticketId, { connection })
  }

  async sellIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    await TicketModel.sellIfAvailable(ticketId, { connection })
  }

  async releaseIfSold(ticketId: number, options?: RepositoryQueryOptions): Promise<boolean> {
    const connection = resolveMysqlConnection(options?.scope)

    return TicketModel.releaseIfSold(ticketId, { connection })
  }
}
