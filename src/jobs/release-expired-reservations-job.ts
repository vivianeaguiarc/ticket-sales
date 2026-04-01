import { ReleaseExpiredReservationsUseCase } from '../use-cases/release-expired-reservations-use-case.js'

export const startReleaseExpiredReservationsJob = (): NodeJS.Timeout => {
  return setInterval(async () => {
    try {
      await ReleaseExpiredReservationsUseCase.execute()
    } catch (error) {
      console.error('Error releasing expired reservations:', error)
    }
  }, 60 * 1000)
}
