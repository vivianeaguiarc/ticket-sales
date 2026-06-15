import { CreateEventUseCase } from '../../application/use-cases/create-event-use-case.js'
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id-use-case.js'
import { GetEventsUseCase } from '../../application/use-cases/get-events-use-case.js'
import { GetPartnerEventsUseCase } from '../../application/use-cases/get-partner-events-use-case.js'
import { MysqlTransactionManager } from '../database/mysql-transaction-manager.js'
import { MysqlAuditLogRepository } from '../repositories/mysql-audit-log-repository.js'
import { MysqlEventRepository } from '../repositories/mysql-event-repository.js'

let sharedEventRepository: MysqlEventRepository | null = null
let createEventUseCase: CreateEventUseCase | null = null
let getEventsUseCase: GetEventsUseCase | null = null
let getPartnerEventsUseCase: GetPartnerEventsUseCase | null = null
let getEventByIdUseCase: GetEventByIdUseCase | null = null

export function getSharedEventRepository(): MysqlEventRepository {
  if (!sharedEventRepository) {
    sharedEventRepository = new MysqlEventRepository()
  }

  return sharedEventRepository
}

export function getCreateEventUseCase(): CreateEventUseCase {
  if (!createEventUseCase) {
    createEventUseCase = new CreateEventUseCase({
      eventRepository: getSharedEventRepository(),
      auditLogRepository: new MysqlAuditLogRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return createEventUseCase
}

export function getGetEventsUseCase(): GetEventsUseCase {
  if (!getEventsUseCase) {
    getEventsUseCase = new GetEventsUseCase(getSharedEventRepository())
  }

  return getEventsUseCase
}

export function getGetPartnerEventsUseCase(): GetPartnerEventsUseCase {
  if (!getPartnerEventsUseCase) {
    getPartnerEventsUseCase = new GetPartnerEventsUseCase(getSharedEventRepository())
  }

  return getPartnerEventsUseCase
}

export function getGetEventByIdUseCase(): GetEventByIdUseCase {
  if (!getEventByIdUseCase) {
    getEventByIdUseCase = new GetEventByIdUseCase(getSharedEventRepository())
  }

  return getEventByIdUseCase
}

export function resetEventUseCasesForTests(): void {
  sharedEventRepository = null
  createEventUseCase = null
  getEventsUseCase = null
  getPartnerEventsUseCase = null
  getEventByIdUseCase = null
}
