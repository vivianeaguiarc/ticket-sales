import * as mysql from 'mysql2/promise'

import { env } from './config/env.js'

export class Database {
  private static instance: mysql.Pool

  private constructor() {}

  public static getInstance(): mysql.Pool {
    if (!Database.instance) {
      Database.instance = mysql.createPool({
        host: env.db.host,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        port: env.db.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      })
    }

    return Database.instance
  }
}
