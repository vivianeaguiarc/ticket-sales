import { Database } from '../database.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

interface Input {
  customer_id: number
  ticket_ids: number[]
}

export class CreatePurchaseUseCase {
  static async execute(input: Input) {
    const { customer_id, ticket_ids } = input

    if (!ticket_ids || ticket_ids.length === 0) {
      throw new Error('ticket_ids is required')
    }

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const tickets = await TicketModel.findAll(
        {
          where: {
            ids: ticket_ids
          }
        },
        { connection }
      )

      if (tickets.length !== ticket_ids.length) {
        throw new Error('Some tickets not found')
      }

      const total_amount = tickets.reduce((total, ticket) => {
        return total + Number(ticket.price)
      }, 0)

      const purchase = await PurchaseModel.create(
        {
          customer_id,
          total_amount,
          status: PurchaseStatus.paid
        },
        { connection }
      )

      for (const ticket of tickets) {
        await PurchaseTicketModel.create(
          {
            purchase_id: purchase.id,
            ticket_id: ticket.id
          },
          { connection }
        )

        await TicketModel.sellIfAvailable(ticket.id, { connection })

        await TicketStatusHistoryModel.create(
          {
            ticket_id: ticket.id,
            from_status: TicketStatus.available,
            to_status: TicketStatus.sold
          },
          { connection }
        )
      }

      await connection.commit()

      return purchase
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
