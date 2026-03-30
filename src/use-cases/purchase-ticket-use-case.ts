import { Database } from '../database.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'

interface Input {
  purchase_id: number
  ticket_ids: number[]
}

export class PurchaseTicketUseCase {
  static async execute(input: Input): Promise<PurchaseTicketModel[]> {
    const { purchase_id, ticket_ids } = input

    if (!purchase_id) {
      throw new Error('Purchase id is required')
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

      const purchaseTickets = await PurchaseTicketModel.createMany(
        ticket_ids.map((ticket_id) => ({
          purchase_id,
          ticket_id
        })),
        { connection }
      )

      for (const ticketId of ticket_ids) {
        await TicketModel.markAsSold(ticketId, { connection })
      }

      await connection.commit()

      return purchaseTickets
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
