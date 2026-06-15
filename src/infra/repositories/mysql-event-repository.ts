import { EventRepository } from '../../domain/repositories/event-repository.js'
import { EventModel } from '../../models/event-model.js'

export class MysqlEventRepository implements EventRepository {
  async findById(eventId: number): Promise<{ id: number } | null> {
    const event = await EventModel.findById(eventId)

    return event ? { id: event.id } : null
  }
}
