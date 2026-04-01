import { Database } from '../database.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

interface Input {
  customer_id: number
  ticket_ids: number[]
}

export class CreateReservationUseCase {
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

      for (const ticket of tickets) {
        if (ticket.status !== TicketStatus.available) {
          throw new Error(`Ticket ${ticket.id} is not available`)
        }
      }

      const reservations: ReservationTicketModel[] = []

      for (const ticket of tickets) {
        await TicketModel.markAsReserved(ticket.id, { connection })

        await TicketStatusHistoryModel.create(
          {
            ticket_id: ticket.id,
            from_status: TicketStatus.available,
            to_status: TicketStatus.reserved
          },
          { connection }
        )

        const reservation = await ReservationTicketModel.create(
          {
            customer_id,
            ticket_id: ticket.id,
            status: ReservationStatus.reserved
          },
          { connection }
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
