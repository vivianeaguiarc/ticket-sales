import { CancelPurchaseUseCase } from '../../application/use-cases/cancel-purchase-use-case.js'
import { CreatePurchaseUseCase } from '../../application/use-cases/create-purchase-use-case.js'
import { MysqlTransactionManager } from '../database/mysql-transaction-manager.js'
import { MysqlAuditLogRepository } from '../repositories/mysql-audit-log-repository.js'
import { MysqlPurchaseRepository } from '../repositories/mysql-purchase-repository.js'
import { MysqlPurchaseTicketRepository } from '../repositories/mysql-purchase-ticket-repository.js'
import { MysqlReservationRepository } from '../repositories/mysql-reservation-repository.js'
import { MysqlTicketRepository } from '../repositories/mysql-ticket-repository.js'
import { MysqlTicketStatusHistoryRepository } from '../repositories/mysql-ticket-status-history-repository.js'

let createPurchaseUseCase: CreatePurchaseUseCase | null = null
let cancelPurchaseUseCase: CancelPurchaseUseCase | null = null

export function getCreatePurchaseUseCase(): CreatePurchaseUseCase {
  if (!createPurchaseUseCase) {
    createPurchaseUseCase = new CreatePurchaseUseCase({
      ticketRepository: new MysqlTicketRepository(),
      purchaseRepository: new MysqlPurchaseRepository(),
      purchaseTicketRepository: new MysqlPurchaseTicketRepository(),
      ticketStatusHistoryRepository: new MysqlTicketStatusHistoryRepository(),
      auditLogRepository: new MysqlAuditLogRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return createPurchaseUseCase
}

export function getCancelPurchaseUseCase(): CancelPurchaseUseCase {
  if (!cancelPurchaseUseCase) {
    cancelPurchaseUseCase = new CancelPurchaseUseCase({
      purchaseRepository: new MysqlPurchaseRepository(),
      purchaseTicketRepository: new MysqlPurchaseTicketRepository(),
      ticketRepository: new MysqlTicketRepository(),
      ticketStatusHistoryRepository: new MysqlTicketStatusHistoryRepository(),
      reservationRepository: new MysqlReservationRepository(),
      auditLogRepository: new MysqlAuditLogRepository(),
      transactionManager: new MysqlTransactionManager()
    })
  }

  return cancelPurchaseUseCase
}

export function resetPurchaseUseCasesForTests(): void {
  createPurchaseUseCase = null
  cancelPurchaseUseCase = null
}
