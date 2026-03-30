import { Database } from '../database.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel } from '../models/ticket-model.js'

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

      const reservations: ReservationTicketModel[] = []

      for (const ticketId of ticket_ids) {
        await TicketModel.reserveIfAvailable(ticketId, { connection })

        const reservation = await ReservationTicketModel.create(
          {
            customer_id,
            ticket_id: ticketId,
            status: ReservationStatus.reserved
          },
          {
            connection
          }
        )

        reservations.push(reservation)
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
