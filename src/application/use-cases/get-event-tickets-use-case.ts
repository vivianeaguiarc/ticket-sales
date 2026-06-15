import { Ticket } from '../../domain/entities/ticket.js'
import { EventNotFoundError } from '../../domain/errors/ticket-errors.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'

export interface GetEventTicketsInput {
  eventId: number
}

export interface GetEventTicketsDependencies {
  eventRepository: EventRepository
  ticketRepository: TicketRepository
}

export class GetEventTicketsUseCase {
  constructor(private readonly dependencies: GetEventTicketsDependencies) {}

  async execute(input: GetEventTicketsInput): Promise<Ticket[]> {
    const event = await this.dependencies.eventRepository.findById(input.eventId)

    if (!event) {
      throw new EventNotFoundError()
    }

    return this.dependencies.ticketRepository.findByEventId(input.eventId)
  }
}
