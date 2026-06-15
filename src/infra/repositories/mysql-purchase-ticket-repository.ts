import { PurchaseTicket } from '../../domain/entities/purchase-ticket.js'
import {
  CreatePurchaseTicketData,
  PurchaseTicketRepository
} from '../../domain/repositories/purchase-ticket-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { PurchaseTicketModel } from '../../models/purchase-ticket-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainPurchaseTicket(model: PurchaseTicketModel): PurchaseTicket {
  return new PurchaseTicket(model.id, model.purchase_id, model.ticket_id)
}

export class MysqlPurchaseTicketRepository implements PurchaseTicketRepository {
  async create(
    data: CreatePurchaseTicketData,
    options?: RepositoryQueryOptions
  ): Promise<PurchaseTicket> {
    const connection = resolveMysqlConnection(options?.scope)
    const purchaseTicket = await PurchaseTicketModel.create(
      {
        purchase_id: data.purchaseId,
        ticket_id: data.ticketId
      },
      { connection }
    )

    return toDomainPurchaseTicket(purchaseTicket)
  }

  async findByPurchaseId(
    purchaseId: number,
    options?: RepositoryQueryOptions
  ): Promise<PurchaseTicket[]> {
    const connection = resolveMysqlConnection(options?.scope)
    const purchaseTickets = await PurchaseTicketModel.findAll(
      { where: { purchase_id: purchaseId } },
      { connection }
    )

    return purchaseTickets.map(toDomainPurchaseTicket)
  }
}
