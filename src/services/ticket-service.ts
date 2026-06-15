import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { EventModel } from '../models/event-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'

export class TicketService {
  async createMany(data: { eventId: number; numTickets: number; price: number; userId: number }) {
    const event = await EventModel.findById(data.eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    const ticketsData = Array(data.numTickets)
      .fill({})
      .map((_, index) => ({
        location: `Location ${index}`,
        event_id: event.id,
        price: data.price,
        status: TicketStatus.available
      }))

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const tickets = await TicketModel.createMany(ticketsData, { connection })

      await AuditLogModel.create(
        {
          user_id: data.userId,
          action: AuditAction.TICKETS_CREATED,
          entity_type: AuditEntityType.ticket,
          entity_id: event.id,
          new_data: {
            event_id: event.id,
            ticket_ids: tickets.map((ticket) => ticket.id),
            quantity: tickets.length,
            price: data.price,
            status: TicketStatus.available
          }
        },
        { connection }
      )

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async findByEventId(eventId: number) {
    const event = await EventModel.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }
    return await TicketModel.findAll({ where: { event_id: eventId } })
  }

  async findById(eventId: number, ticketId: number) {
    const ticket = await TicketModel.findById(ticketId)
    return ticket && ticket.event_id === eventId ? ticket : null
  }
}
