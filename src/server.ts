import { app } from './app.js'
import { env, validateProductionEnv } from './config/env.js'
import { Database } from './database.js'
import { startReleaseExpiredReservationsJob } from './jobs/release-expired-reservations-job.js'

async function bootstrap(): Promise<void> {
  validateProductionEnv()

  try {
    const pool = Database.getInstance()
    await pool.query('SELECT 1')

    console.log('[startup] Database connected')
    console.log(`[startup] DB target: ${env.db.host}:${env.db.port}/${env.db.database}`)
  } catch (error) {
    console.error('[startup] Database connection failed:', error)
    process.exit(1)
  }

  app.listen(env.port, env.host, () => {
    console.log(`[startup] Ticket Sales API listening on ${env.host}:${env.port}`)
    console.log(`[startup] NODE_ENV=${env.nodeEnv}`)
    console.log('[startup] Health: /health | Readiness: /ready | Docs: /docs')

    startReleaseExpiredReservationsJob()
    console.log('[startup] Expired reservations job started')
  })
}

bootstrap().catch((error: unknown) => {
  console.error('[startup] Fatal error:', error)
  process.exit(1)
})
