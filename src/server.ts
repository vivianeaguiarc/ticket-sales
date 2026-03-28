import { app } from './app.js'
import { Database } from './database.js'

app.listen(3000, async () => {
  try {
    const connection = Database.getInstance()

    await connection.execute('SET FOREIGN_KEY_CHECKS = 0')
    await connection.execute('TRUNCATE TABLE events')
    await connection.execute('TRUNCATE TABLE customers')
    await connection.execute('TRUNCATE TABLE partners')
    await connection.execute('TRUNCATE TABLE users')
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1')

    console.log('🧹 Database cleaned (tables truncated)')
    console.log('🚀 Server running on http://localhost:3000')
  } catch (error) {
    console.error('❌ Error during server startup:', error)
  }
})
