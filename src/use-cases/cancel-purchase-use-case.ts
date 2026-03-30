import { Database } from '../database.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'

interface Input {
  purchase_id: number
}

export class CancelPurchaseUseCase {
  static async execute(input: Input): Promise<void> {
    const { purchase_id } = input

    if (!purchase_id) {
      throw new Error('Purchase id is required')
    }

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const purchaseTickets = await PurchaseTicketModel.findAll(
        {
          where: {
            purchase_id
          }
        },
        {
          connection
        }
      )

      if (purchaseTickets.length === 0) {
        throw new Error('Purchase tickets not found')
      }

      for (const purchaseTicket of purchaseTickets) {
        await TicketModel.markAsAvailable(purchaseTicket.ticket_id, { connection })
      }

      for (const purchaseTicket of purchaseTickets) {
        await purchaseTicket.delete({ connection })
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
