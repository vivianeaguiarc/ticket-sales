import { Event } from '../../domain/entities/event.js'
import { EventModel } from '../../models/event-model.js'

export function toEventModel(event: Event): EventModel {
  return new EventModel({
    id: event.id,
    partner_id: event.partnerId,
    name: event.name,
    description: event.description,
    date: event.date,
    location: event.location,
    created_at: event.createdAt
  })
}

export function toEventModels(events: Event[]): EventModel[] {
  return events.map(toEventModel)
}
