import { Ticket, TicketStatus } from '../entities/ticket.js'
import { TransactionScope } from './transaction-scope.js'

export interface RepositoryQueryOptions {
  scope?: TransactionScope
  forUpdate?: boolean
}

export interface CreateTicketData {
  location: string
  eventId: number
  price: number
  status: TicketStatus
}

export interface TicketRepository {
  findById(ticketId: number, options?: RepositoryQueryOptions): Promise<Ticket | null>
  findByIds(ticketIds: number[], options?: RepositoryQueryOptions): Promise<Ticket[]>
  findByEventId(eventId: number, options?: RepositoryQueryOptions): Promise<Ticket[]>
  createMany(data: CreateTicketData[], options?: RepositoryQueryOptions): Promise<Ticket[]>
  reserveIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  sellIfAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  markAsSold(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  markAsAvailable(ticketId: number, options?: RepositoryQueryOptions): Promise<void>
  releaseIfSold(ticketId: number, options?: RepositoryQueryOptions): Promise<boolean>
}
