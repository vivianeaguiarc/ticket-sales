import { Database } from '../../database.js'
import { TransactionManager } from '../../domain/repositories/transaction-manager.js'
import { TransactionScope } from '../../domain/repositories/transaction-scope.js'
import { MysqlTransactionScope } from './mysql-transaction-scope.js'

export class MysqlTransactionManager implements TransactionManager {
  async runInTransaction<T>(work: (scope: TransactionScope) => Promise<T>): Promise<T> {
    const pool = Database.getInstance()
    const connection = await pool.getConnection()
    const scope = new MysqlTransactionScope(connection)

    try {
      await connection.beginTransaction()
      const result = await work(scope)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
