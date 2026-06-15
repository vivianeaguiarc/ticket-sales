import { Ticket } from '../../domain/entities/ticket.js'
import { TicketRepository } from '../../domain/repositories/ticket-repository.js'

export interface GetTicketByIdInput {
  eventId: number
  ticketId: number
}

export interface GetTicketByIdDependencies {
  ticketRepository: TicketRepository
}

export class GetTicketByIdUseCase {
  constructor(private readonly dependencies: GetTicketByIdDependencies) {}

  async execute(input: GetTicketByIdInput): Promise<Ticket | null> {
    const ticket = await this.dependencies.ticketRepository.findById(input.ticketId)

    if (!ticket || ticket.eventId !== input.eventId) {
      return null
    }

    return ticket
  }
}
