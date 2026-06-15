import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import {
  CreateTicketStatusHistoryData,
  TicketStatusHistoryRepository
} from '../../domain/repositories/ticket-status-history-repository.js'
import { TicketStatusHistoryModel } from '../../models/ticket-status-history-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

export class MysqlTicketStatusHistoryRepository implements TicketStatusHistoryRepository {
  async create(
    data: CreateTicketStatusHistoryData,
    options?: RepositoryQueryOptions
  ): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    await TicketStatusHistoryModel.create(
      {
        ticket_id: data.ticketId,
        from_status: data.fromStatus,
        to_status: data.toStatus
      },
      { connection }
    )
  }
}
