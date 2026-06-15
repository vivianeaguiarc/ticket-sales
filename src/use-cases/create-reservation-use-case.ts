import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { ReservationStatus, ReservationTicketModel } from '../models/reservation-ticket-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

interface Input {
  customer_id: number
  user_id: number
  ticket_ids: number[]
}

export class CreateReservationUseCase {
  static async execute(input: Input) {
    const { customer_id, user_id, ticket_ids } = input

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
        { connection, forUpdate: true }
      )

      if (tickets.length !== ticket_ids.length) {
        throw new Error('Some tickets not found')
      }

      const reservations: ReservationTicketModel[] = []

      for (const ticketId of ticket_ids) {
        await TicketModel.reserveIfAvailable(ticketId, { connection })

        await TicketStatusHistoryModel.create(
          {
            ticket_id: ticketId,
            from_status: TicketStatus.available,
            to_status: TicketStatus.reserved
          },
          { connection }
        )

        const reservation = await ReservationTicketModel.create(
          {
            customer_id,
            ticket_id: ticketId,
            status: ReservationStatus.reserved
          },
          { connection }
        )

        reservations.push(reservation)
      }

      await AuditLogModel.create(
        {
          user_id,
          action: AuditAction.TICKETS_RESERVED,
          entity_type: AuditEntityType.reservation,
          entity_id: reservations[0]?.id ?? null,
          new_data: {
            customer_id,
            ticket_ids,
            reservation_ids: reservations.map((reservation) => reservation.id),
            status: ReservationStatus.reserved
          }
        },
        { connection }
      )

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
