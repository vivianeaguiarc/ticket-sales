import { Database } from '../database.js'

export class HealthService {
  async checkDatabase(): Promise<boolean> {
    try {
      const db = Database.getInstance()
      await db.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }
}
