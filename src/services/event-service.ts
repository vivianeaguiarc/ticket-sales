import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { EventModel } from '../models/event-model.js'

export class EventService {
  async create(data: {
    name: string
    description: string | null
    date: Date
    location: string
    partnerId: number
    userId: number
  }) {
    const { name, description, date, location, partnerId, userId } = data

    const pool = Database.getInstance()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const event = await EventModel.create(
        {
          partner_id: partnerId,
          name,
          description,
          date,
          location
        },
        { connection }
      )

      await AuditLogModel.create(
        {
          user_id: userId,
          action: AuditAction.EVENT_CREATED,
          entity_type: AuditEntityType.event,
          entity_id: event.id,
          new_data: {
            partner_id: partnerId,
            name,
            description,
            date,
            location
          }
        },
        { connection }
      )

      await connection.commit()

      return {
        id: event.id,
        partner_id: partnerId,
        name,
        description,
        date: event.date,
        location,
        created_at: event.created_at
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
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
