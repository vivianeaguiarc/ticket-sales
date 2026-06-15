import { RepositoryQueryOptions } from './ticket-repository.js'

export enum AuditAction {
  EVENT_CREATED = 'EVENT_CREATED',
  TICKETS_CREATED = 'TICKETS_CREATED',
  TICKETS_RESERVED = 'TICKETS_RESERVED',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  PURCHASE_CREATED = 'PURCHASE_CREATED',
  PURCHASE_CANCELLED = 'PURCHASE_CANCELLED'
}

export enum AuditEntityType {
  event = 'event',
  ticket = 'ticket',
  reservation = 'reservation',
  purchase = 'purchase'
}

export type AuditLogData = Record<string, unknown>

export interface CreateAuditLogData {
  userId: number
  action: AuditAction
  entityType: AuditEntityType
  entityId: number | null
  newData: AuditLogData
  oldData?: AuditLogData | null
}

export interface AuditLogRepository {
  create(data: CreateAuditLogData, options?: RepositoryQueryOptions): Promise<void>
}
