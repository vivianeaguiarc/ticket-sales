import { Event } from '../../domain/entities/event.js'
import { EventNotFoundError } from '../../domain/errors/event-errors.js'
import {
  CreateEventData,
  EventRepository,
  UpdateEventData
} from '../../domain/repositories/event-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { EventModel } from '../../models/event-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

function toDomainEvent(model: EventModel): Event {
  return new Event(
    model.id,
    model.partner_id,
    model.name,
    model.description,
    model.date,
    model.location,
    model.created_at
  )
}

export class MysqlEventRepository implements EventRepository {
  async create(data: CreateEventData, options?: RepositoryQueryOptions): Promise<Event> {
    const connection = resolveMysqlConnection(options?.scope)
    const event = await EventModel.create(
      {
        partner_id: data.partnerId,
        name: data.name,
        description: data.description,
        date: data.date,
        location: data.location
      },
      { connection }
    )

    return toDomainEvent(event)
  }

  async findById(eventId: number, _options?: RepositoryQueryOptions): Promise<Event | null> {
    const event = await EventModel.findById(eventId)

    return event ? toDomainEvent(event) : null
  }

  async findAll(_options?: RepositoryQueryOptions): Promise<Event[]> {
    const events = await EventModel.findAll()

    return events.map(toDomainEvent)
  }

  async findByPartnerId(partnerId: number, _options?: RepositoryQueryOptions): Promise<Event[]> {
    const events = await EventModel.findAll({
      where: { partner_id: partnerId }
    })

    return events.map(toDomainEvent)
  }

  async update(eventId: number, data: UpdateEventData): Promise<void> {
    const event = await EventModel.findById(eventId)

    if (!event) {
      throw new EventNotFoundError()
    }

    event.partner_id = data.partnerId
    event.name = data.name
    event.description = data.description
    event.date = data.date
    event.location = data.location

    await event.update()
  }

  async delete(eventId: number, _options?: RepositoryQueryOptions): Promise<void> {
    const event = await EventModel.findById(eventId)

    if (!event) {
      throw new EventNotFoundError()
    }

    await event.delete()
  }
}
