import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { executeMock, errorSpy } = vi.hoisted(() => {
  return {
    executeMock: vi.fn(),
    errorSpy: vi.fn()
  }
})

vi.mock('../use-cases/release-expired-reservations-use-case.js', () => {
  return {
    ReleaseExpiredReservationsUseCase: {
      execute: executeMock
    }
  }
})

import { startReleaseExpiredReservationsJob } from './release-expired-reservations-job.js'

describe('startReleaseExpiredReservationsJob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(errorSpy)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('deve executar o use case a cada 60 segundos', async () => {
    executeMock.mockResolvedValue(2)

    const intervalId = startReleaseExpiredReservationsJob()

    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(executeMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(executeMock).toHaveBeenCalledTimes(2)

    clearInterval(intervalId)
  })

  test('deve registrar erro no console se o use case falhar', async () => {
    executeMock.mockRejectedValue(new Error('Job failed'))

    const intervalId = startReleaseExpiredReservationsJob()

    await vi.advanceTimersByTimeAsync(60 * 1000)

    expect(executeMock).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      'Error releasing expired reservations:',
      expect.any(Error)
    )

    clearInterval(intervalId)
  })
})
