import {
  getCreateEventUseCase,
  getGetEventByIdUseCase,
  getGetEventsUseCase,
  getGetPartnerEventsUseCase
} from '../infra/composition/event-factory.js'
import { AuditAction, AuditEntityType, AuditLogModel } from '../models/audit-log-model.js'
import { TicketStatus } from '../models/ticket-model.js'
import { TicketStatusHistoryModel } from '../models/ticket-status-history-model.js'
import { toEventModel, toEventModels } from '../shared/mappers/event-mapper.js'

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

/**
 * Facade legado que delega operações principais para a application layer.
 * getHistory permanece no service até migração futura do subfluxo de histórico.
 */
export class EventService {
  async create(data: {
    name: string
    description: string | null
    date: Date
    location: string
    partnerId: number
    userId: number
  }) {
    const event = await getCreateEventUseCase().execute({
      partnerId: data.partnerId,
      userId: data.userId,
      name: data.name,
      description: data.description,
      date: data.date,
      location: data.location
    })

    return toEventModel(event)
  }

  async findAll(partnerId?: number) {
    if (partnerId !== undefined) {
      const events = await getGetPartnerEventsUseCase().execute({ partnerId })

      return toEventModels(events)
    }

    const events = await getGetEventsUseCase().execute()

    return toEventModels(events)
  }

  async findById(eventId: number) {
    const event = await getGetEventByIdUseCase().execute({ eventId })

    return event ? toEventModel(event) : null
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
