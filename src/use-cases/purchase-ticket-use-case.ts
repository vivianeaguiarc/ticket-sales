import { Database } from '../database.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'

interface Input {
  customer_id: number
  ticket_ids: number[]
}

export class PurchaseTicketUseCase {
  static async execute(input: Input): Promise<PurchaseModel> {
    const { customer_id, ticket_ids } = input

    if (!customer_id) {
      throw new Error('Customer id is required')
    }

    if (!ticket_ids || ticket_ids.length === 0) {
      throw new Error('At least one ticket id is required')
    }

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      for (const ticketId of ticket_ids) {
        await TicketModel.reserveIfAvailable(ticketId, { connection })
      }

      const tickets = await TicketModel.findAll(
        {
          where: {
            ids: ticket_ids
          }
        },
        { connection }
      )

      if (tickets.length !== ticket_ids.length) {
        throw new Error('One or more tickets not found')
      }

      const total_amount = tickets.reduce((total, ticket) => total + ticket.price, 0)

      const purchase = await PurchaseModel.create(
        {
          customer_id,
          total_amount,
          status: PurchaseStatus.paid
        },
        { connection }
      )

      await PurchaseTicketModel.createMany(
        ticket_ids.map((ticket_id) => ({
          purchase_id: purchase.id,
          ticket_id
        })),
        { connection }
      )

      for (const ticketId of ticket_ids) {
        await TicketModel.markAsSold(ticketId, { connection })
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
