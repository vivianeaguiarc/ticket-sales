import { CreateTicketsUseCase } from '../../application/use-cases/create-tickets-use-case.js'
import { GetEventTicketsUseCase } from '../../application/use-cases/get-event-tickets-use-case.js'
import { GetTicketByIdUseCase } from '../../application/use-cases/get-ticket-by-id-use-case.js'
import { MysqlTransactionManager } from '../database/mysql-transaction-manager.js'
import { MysqlAuditLogRepository } from '../repositories/mysql-audit-log-repository.js'
import { MysqlEventRepository } from '../repositories/mysql-event-repository.js'
import { MysqlTicketRepository } from '../repositories/mysql-ticket-repository.js'

let createTicketsUseCase: CreateTicketsUseCase | null = null
let getEventTicketsUseCase: GetEventTicketsUseCase | null = null
let getTicketByIdUseCase: GetTicketByIdUseCase | null = null
let sharedTicketRepository: MysqlTicketRepository | null = null

export function getSharedTicketRepository(): MysqlTicketRepository {
  if (!sharedTicketRepository) {
    sharedTicketRepository = new MysqlTicketRepository()
  }

  return sharedTicketRepository
}

export function getCreateTicketsUseCase(): CreateTicketsUseCase {
  if (!createTicketsUseCase) {
    createTicketsUseCase = new CreateTicketsUseCase({
      eventRepository: new MysqlEventRepository(),
      ticketRepository: getSharedTicketRepository(),
      auditLogRepository: new MysqlAuditLogRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return createTicketsUseCase
}

export function getGetEventTicketsUseCase(): GetEventTicketsUseCase {
  if (!getEventTicketsUseCase) {
    getEventTicketsUseCase = new GetEventTicketsUseCase({
      eventRepository: new MysqlEventRepository(),
      ticketRepository: getSharedTicketRepository()
    })
  }

  return getEventTicketsUseCase
}

export function getGetTicketByIdUseCase(): GetTicketByIdUseCase {
  if (!getTicketByIdUseCase) {
    getTicketByIdUseCase = new GetTicketByIdUseCase({
      ticketRepository: getSharedTicketRepository()
    })
  }

  return getTicketByIdUseCase
}

export function resetTicketUseCasesForTests(): void {
  createTicketsUseCase = null
  getEventTicketsUseCase = null
  getTicketByIdUseCase = null
  sharedTicketRepository = null
}
