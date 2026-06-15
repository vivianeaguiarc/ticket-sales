import * as mysql from 'mysql2/promise'

import { env } from '../../config/env.js'

const TABLES_TO_TRUNCATE = [
  'audit_logs',
  'ticket_status_history',
  'purchase_tickets',
  'purchases',
  'reservation_tickets',
  'tickets',
  'events',
  'customers',
  'partners',
  'users'
] as const

export async function isDatabaseAvailable(): Promise<boolean> {
  let connection: mysql.Connection | undefined

  try {
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      connectTimeout: 3000
    })

    await connection.query('SELECT 1')

    return true
  } catch {
    return false
  } finally {
    await connection?.end()
  }
}

export async function resetE2eDatabase(): Promise<void> {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database
  })

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')

    for (const table of TABLES_TO_TRUNCATE) {
      await connection.query(`TRUNCATE TABLE \`${table}\``)
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
  } finally {
    await connection.end()
  }
}

export function createE2eRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
