import { Database } from '../database.js'
import { ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

interface Input {
  customer_id: number
  ticket_ids: number[]
}

export class ReserveTicketUseCase {
  static async execute(input: Input): Promise<ReservationTicketModel[]> {
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

      const reservations: ReservationTicketModel[] = []

      for (const ticketId of ticket_ids) {
        const reservation = await ReservationTicketModel.create(
          {
            customer_id,
            ticket_id: ticketId,
            status: TicketStatus.reserved
          },
          { connection }
        )

        reservations.push(reservation)
      }

      for (const ticketId of ticket_ids) {
        await TicketStatusHistoryModel.create(
          {
            ticket_id: ticketId,
            from_status: TicketStatus.available,
            to_status: TicketStatus.reserved
          },
          { connection }
        )
      }

      await connection.commit()

      return reservations
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
