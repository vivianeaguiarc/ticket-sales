import { PoolConnection } from 'mysql2/promise'

import { Database } from '../database.js'
import { PurchaseStatus, PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'

export class PurchaseTicketService {
  async execute(customerId: number, ticketId: number) {
    let connection: PoolConnection | undefined

    try {
      connection = await Database.getInstance().getConnection()
      await connection.beginTransaction()

      const ticket = await TicketModel.findById(ticketId, { connection })

      if (!ticket) {
        throw new Error('Ticket not found')
      }

      if (ticket.status !== TicketStatus.available) {
        throw new Error('Ticket unavailable')
      }

      const purchase = await PurchaseTicketModel.create(
        {
          customer_id: customerId,
          ticket_id: ticketId,
          status: PurchaseStatus.completed
        },
        { connection }
      )

      await TicketModel.updateStatus(ticketId, TicketStatus.sold, { connection })

      await connection.commit()

      return purchase
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }

      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
}
