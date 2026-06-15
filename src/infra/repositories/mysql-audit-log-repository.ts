import {
  AuditLogRepository,
  CreateAuditLogData
} from '../../domain/repositories/audit-log-repository.js'
import { RepositoryQueryOptions } from '../../domain/repositories/ticket-repository.js'
import { AuditLogModel } from '../../models/audit-log-model.js'
import { resolveMysqlConnection } from '../database/mysql-transaction-scope.js'

export class MysqlAuditLogRepository implements AuditLogRepository {
  async create(data: CreateAuditLogData, options?: RepositoryQueryOptions): Promise<void> {
    const connection = resolveMysqlConnection(options?.scope)

    await AuditLogModel.create(
      {
        user_id: data.userId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        old_data: data.oldData ?? null,
        new_data: data.newData
      },
      { connection }
    )
  }
}
