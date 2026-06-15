import { PurchaseTicket } from '../entities/purchase-ticket.js'
import { RepositoryQueryOptions } from './ticket-repository.js'

export interface CreatePurchaseTicketData {
  purchaseId: number
  ticketId: number
}

export interface PurchaseTicketRepository {
  create(data: CreatePurchaseTicketData, options?: RepositoryQueryOptions): Promise<PurchaseTicket>
  findByPurchaseId(purchaseId: number, options?: RepositoryQueryOptions): Promise<PurchaseTicket[]>
}
