import { ReleaseExpiredReservationsUseCase } from '../use-cases/release-expired-reservations-use-case.js'

let isRunning = false

export const startReleaseExpiredReservationsJob = (): NodeJS.Timeout => {
  return setInterval(async () => {
    if (isRunning) {
      return
    }

    isRunning = true

    try {
      await ReleaseExpiredReservationsUseCase.execute()
    } catch (error) {
      console.error('Error releasing expired reservations:', error)
    } finally {
      isRunning = false
    }
  }, 60 * 1000)
}
