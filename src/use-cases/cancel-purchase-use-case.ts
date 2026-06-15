import { Database } from '../database.js'
import { PurchaseModel, PurchaseStatus } from '../models/purchase-model.js'
import { PurchaseTicketModel } from '../models/purchase-ticket-model.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

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

      const purchase = await PurchaseModel.findById(purchase_id, {
        connection,
        forUpdate: true
      })

      if (!purchase) {
        throw new Error('Purchase not found')
      }

      if (purchase.status === PurchaseStatus.cancelled) {
        throw new Error('Purchase already cancelled')
      }

      const purchaseTickets = await PurchaseTicketModel.findAll(
        {
          where: {
            purchase_id
          }
        },
        { connection }
      )

      if (purchaseTickets.length === 0) {
        throw new Error('Purchase tickets not found')
      }

      const ticketIds = purchaseTickets.map((purchaseTicket) => purchaseTicket.ticket_id)

      for (const ticketId of ticketIds) {
        const released = await TicketModel.releaseIfSold(ticketId, { connection })

        if (released) {
          await TicketStatusHistoryModel.create(
            {
              ticket_id: ticketId,
              from_status: TicketStatus.sold,
              to_status: TicketStatus.available
            },
            { connection }
          )
        }
      }

      const reservations = await ReservationTicketModel.findAll(
        {
          where: {
            customer_id: purchase.customer_id,
            ticket_id: ticketIds,
            status: ReservationStatus.reserved
          }
        },
        { connection }
      )

      for (const reservation of reservations) {
        await ReservationTicketModel.markAsCancelled(reservation.id, { connection })
      }

      purchase.status = PurchaseStatus.cancelled
      await purchase.update({ connection })

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
