import { Event } from '../../domain/entities/event.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'

export interface GetEventByIdInput {
  eventId: number
}

export class GetEventByIdUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: GetEventByIdInput): Promise<Event | null> {
    return this.eventRepository.findById(input.eventId)
  }
}
