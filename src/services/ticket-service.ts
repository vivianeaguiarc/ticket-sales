import { EventModel } from '../models/event-model.js'
import { TicketModel, TicketStatus } from '../models/ticket-model.js'

export class TicketService {
  async createMany(data: { eventId: number; numTickets: number; price: number }) {
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

    await TicketModel.createMany(ticketsData)
  }
}
