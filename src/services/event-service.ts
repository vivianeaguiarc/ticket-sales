import { Database } from '../database.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { EventModel } from '../models/event-model.js'
import { TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'

export type EventHistoryTicketStatusItem = {
  type: 'ticket_status_history'
  ticket_id: number
  from_status: TicketStatus
  to_status: TicketStatus
  changed_at: string
}

export type EventHistoryAuditLogItem = {
  type: 'audit_log'
  action: AuditAction
  entity_type: AuditEntityType
  entity_id: number | null
  created_at: string
}

export type EventHistoryItem = EventHistoryTicketStatusItem | EventHistoryAuditLogItem

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

  async getHistory(eventId: number): Promise<EventHistoryItem[]> {
    const [statusHistory, auditLogs] = await Promise.all([
      TicketStatusHistoryModel.findByEventId(eventId),
      AuditLogModel.findByEventId(eventId)
    ])

    const items: EventHistoryItem[] = [
      ...statusHistory.map((history) => ({
        type: 'ticket_status_history' as const,
        ticket_id: history.ticket_id,
        from_status: history.from_status,
        to_status: history.to_status,
        changed_at: new Date(history.changed_at).toISOString()
      })),
      ...auditLogs.map((auditLog) => ({
        type: 'audit_log' as const,
        action: auditLog.action,
        entity_type: auditLog.entity_type,
        entity_id: auditLog.entity_id,
        created_at: new Date(auditLog.created_at).toISOString()
      }))
    ]

    return items.sort((left, right) => {
      const leftDate = left.type === 'ticket_status_history' ? left.changed_at : left.created_at
      const rightDate = right.type === 'ticket_status_history' ? right.changed_at : right.created_at

      return new Date(rightDate).getTime() - new Date(leftDate).getTime()
    })
  }
}
