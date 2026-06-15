import { TicketStatus } from '../entities/ticket.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreateTicketStatusHistoryData {
  ticketId: number
  fromStatus: TicketStatus
  toStatus: TicketStatus
}

export interface TicketStatusHistoryRepository {
  create(data: CreateTicketStatusHistoryData, options?: RepositoryQueryOptions): Promise<void>
}
