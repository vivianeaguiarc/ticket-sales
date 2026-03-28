import * as mysql from 'mysql2/promise'
// Singleton
export class Database {
  private static instance: mysql.Pool

  private constructor() {}

  public static getInstance(): mysql.Pool {
    if (!Database.instance) {
      Database.instance = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'tickets',
        port: 3307,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      })
    }

    return Database.instance
  }
}
