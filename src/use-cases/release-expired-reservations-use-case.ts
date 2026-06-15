import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
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
            expires_at: new Date()
          }
        },
        { connection, forUpdate: true }
      )

      for (const reservation of expiredReservations) {
        const released = await TicketModel.releaseIfReserved(reservation.ticket_id, {
          connection
        })

        if (released) {
          await TicketStatusHistoryModel.create(
            {
              ticket_id: reservation.ticket_id,
              from_status: TicketStatus.reserved,
              to_status: TicketStatus.available
            },
            { connection }
          )
        }

        await ReservationTicketModel.markAsCancelled(reservation.id, { connection })

        await AuditLogModel.create(
          {
            user_id: null,
            action: AuditAction.RESERVATION_EXPIRED,
            entity_type: AuditEntityType.reservation,
            entity_id: reservation.id,
            old_data: {
              status: ReservationStatus.reserved,
              ticket_id: reservation.ticket_id,
              expires_at: reservation.expires_at
            },
            new_data: {
              status: ReservationStatus.cancelled,
              ticket_id: reservation.ticket_id,
              ticket_released: released
            }
          },
          { connection }
        )
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
