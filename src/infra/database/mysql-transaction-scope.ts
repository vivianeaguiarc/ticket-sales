import { PoolConnection } from 'mysql2/promise'

import { TransactionScope } from '../../domain/repositories/transaction-scope.js'

export class MysqlTransactionScope implements TransactionScope {
  readonly kind = 'transaction' as const

  constructor(public readonly connection: PoolConnection) {}
}

export function resolveMysqlConnection(scope?: TransactionScope): PoolConnection | undefined {
  if (scope instanceof MysqlTransactionScope) {
    return scope.connection
  }

  return undefined
}
