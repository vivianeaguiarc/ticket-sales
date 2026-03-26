import * as mysql from 'mysql2/promise'

import { app } from './app.js'

function createConnextion() {
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'tickets',
    port: 3307
  })
}

app.listen(3000, async () => {
  try {
    const connection = await createConnextion()

    await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
    await connection.execute('TRUNCATE TABLE events')
    await connection.execute('TRUNCATE TABLE customers')
    await connection.execute('TRUNCATE TABLE partners')
    await connection.execute('TRUNCATE TABLE users')

    console.log('🧹 Database cleaned (tables truncated)')
    console.log('🚀 Server running on http://localhost:3000')
  } catch (error) {
    console.error('❌ Error during server startup:', error)
  }
})
