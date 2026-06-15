import { Ticket } from '../../domain/entities/ticket.js'
import { TicketModel } from '../../models/ticket-model.js'

export function toTicketModel(ticket: Ticket): TicketModel {
  return new TicketModel({
    id: ticket.id,
    event_id: ticket.eventId,
    location: ticket.location,
    price: ticket.price,
    status: ticket.status,
    created_at: ticket.createdAt
  })
}

export function toTicketModels(tickets: Ticket[]): TicketModel[] {
  return tickets.map(toTicketModel)
}
