import { Ticket } from '../entities/ticket.js'
import { TransactionScope } from './transaction-scope.js'

export interface RepositoryQueryOptions {
  scope?: TransactionScope
  forUpdate?: boolean
}

export interface TicketRepository {
  findByIds(ticketIds: number[], options?: RepositoryQueryOptions): Promise<Ticket[]>
  reserveIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  sellIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  releaseIfSold(ticketId: number, options?: RepositoryQueryOptions): Promise<boolean>
}
