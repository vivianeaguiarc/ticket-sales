import { app } from './app.js'
import { Database } from './database.js'
import { startReleaseExpiredReservationsJob } from './jobs/release-expired-reservations-job.js'

app.listen(3000, async () => {
  let dbConnection

  try {
    const pool = Database.getInstance()
    dbConnection = await pool.getConnection()

    await dbConnection.execute('SET FOREIGN_KEY_CHECKS = 0')
    await dbConnection.execute('TRUNCATE TABLE tickets')
    await dbConnection.execute('TRUNCATE TABLE events')
    await dbConnection.execute('TRUNCATE TABLE customers')
    await dbConnection.execute('TRUNCATE TABLE partners')
    await dbConnection.execute('TRUNCATE TABLE users')
    await dbConnection.execute('SET FOREIGN_KEY_CHECKS = 1')

    console.log('🧹 Database cleaned (tables truncated)')
    console.log('🚀 Server running on http://localhost:3000')

    // 🔥 INICIA O JOB AQUI
    startReleaseExpiredReservationsJob()
  } catch (error) {
    console.error('❌ Error during server startup:', error)
  } finally {
    if (dbConnection) dbConnection.release()
  }
})
