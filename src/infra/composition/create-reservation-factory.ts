import { CreateReservationUseCase } from '../../application/use-cases/create-reservation-use-case.js'
import { MysqlTransactionManager } from '../database/mysql-transaction-manager.js'
import { MysqlAuditLogRepository } from '../repositories/mysql-audit-log-repository.js'
import { MysqlReservationRepository } from '../repositories/mysql-reservation-repository.js'
import { MysqlTicketRepository } from '../repositories/mysql-ticket-repository.js'
import { MysqlTicketStatusHistoryRepository } from '../repositories/mysql-ticket-status-history-repository.js'

let createReservationUseCase: CreateReservationUseCase | null = null

export function getCreateReservationUseCase(): CreateReservationUseCase {
  if (!createReservationUseCase) {
    createReservationUseCase = new CreateReservationUseCase({
      ticketRepository: new MysqlTicketRepository(),
      reservationRepository: new MysqlReservationRepository(),
      ticketStatusHistoryRepository: new MysqlTicketStatusHistoryRepository(),
      auditLogRepository: new MysqlAuditLogRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return createReservationUseCase
}

export function resetCreateReservationUseCaseForTests(): void {
  createReservationUseCase = null
}
