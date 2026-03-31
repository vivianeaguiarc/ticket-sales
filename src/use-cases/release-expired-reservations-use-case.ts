import { Database } from '../database.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

export class ReleaseExpiredReservationsUseCase {
  static async execute(): Promise<number> {
    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const expiredReservations = await ReservationTicketModel.findAll(
        {
          where: {
            status: ReservationStatus.reserved,
            expires_before: new Date()
          }
        },
        { connection }
      )

      for (const reservation of expiredReservations) {
        await TicketModel.markAsAvailable(reservation.ticket_id, { connection })

        await TicketStatusHistoryModel.create(
          {
            ticket_id: reservation.ticket_id,
            from_status: TicketStatus.reserved,
            to_status: TicketStatus.available
          },
          { connection }
        )

        await reservation.delete({ connection })
      }

      await connection.commit()

      return expiredReservations.length
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
