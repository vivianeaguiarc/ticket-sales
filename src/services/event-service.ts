import { Database } from '../database.js'
import { EventModel } from '../models/event-model.js'

export class EventService {
  async create(data: {
    name: string
    description: string | null
    date: Date
    location: string
    partnerId: number
  }) {
    const { name, description, date, location, partnerId } = data

    const connection = Database.getInstance()

    try {
      const event = await EventModel.create({
        partner_id: partnerId,
        name,
        description,
        date,
        location
      })

      return {
        id: event.id,
        partner_id: partnerId,
        name,
        description,
        date,
        location,
        created_at: event.created_at
      }
    } finally {
      await connection.end()
    }
  }
  async findAll(partnerId?: number) {
    return EventModel.findAll({
      where: { partner_id: partnerId }
    })
  }

  async findById(eventId: number) {
    return EventModel.findById(eventId)
  }
}
