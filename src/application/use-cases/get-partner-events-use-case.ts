import { Event } from '../../domain/entities/event.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'

export interface GetPartnerEventsInput {
  partnerId: number
}

export class GetPartnerEventsUseCase {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: GetPartnerEventsInput): Promise<Event[]> {
    return this.eventRepository.findByPartnerId(input.partnerId)
  }
}
