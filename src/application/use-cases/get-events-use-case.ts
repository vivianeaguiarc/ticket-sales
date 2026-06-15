import { Event } from '../../domain/entities/event.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'

export class GetEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<Event[]> {
    return this.eventRepository.findAll()
  }
}
