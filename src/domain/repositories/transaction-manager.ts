import { TransactionScope } from './transaction-scope.js'

export interface TransactionManager {
  runInTransaction<T>(work: (scope: TransactionScope) => Promise<T>): Promise<T>
}
