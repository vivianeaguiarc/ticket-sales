import { Event } from '../../domain/entities/event.js'
import {
  AuditAction,
  AuditEntityType,
  AuditLogRepository
} from '../../domain/repositories/audit-log-repository.js'
import { EventRepository } from '../../domain/repositories/event-repository.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'

export interface CreateEventInput {
  partnerId: number
  userId: number
  name: string
  description: string | null
  date: Date
  location: string
}

export interface CreateEventDependencies {
  eventRepository: EventRepository
  auditLogRepository: AuditLogRepository
  transactionManager: TransactionManager
}

export class CreateEventUseCase {
  constructor(private readonly dependencies: CreateEventDependencies) {}

  async execute(input: CreateEventInput): Promise<Event> {
    return this.dependencies.transactionManager.runInTransaction(async (scope) => {
      const event = await this.dependencies.eventRepository.create(
        {
          partnerId: input.partnerId,
          name: input.name,
          description: input.description,
          date: input.date,
          location: input.location
        },
        { scope }
      )

      await this.dependencies.auditLogRepository.create(
        {
          userId: input.userId,
          action: AuditAction.EVENT_CREATED,
          entityType: AuditEntityType.event,
          entityId: event.id,
          newData: {
            partner_id: input.partnerId,
            name: input.name,
            description: input.description,
            date: input.date,
            location: input.location
          }
        },
        { scope }
      )

      return event
    })
  }
}
