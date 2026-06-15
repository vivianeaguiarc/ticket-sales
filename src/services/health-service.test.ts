import { beforeEach, describe, expect, test, vi } from 'vitest'

const { queryMock, getInstanceMock } = vi.hoisted(() => {
  return {
    queryMock: vi.fn(),
    getInstanceMock: vi.fn()
  }
})

vi.mock('../database.js', () => {
  return {
    Database: {
      getInstance: getInstanceMock
    }
  }
})

import { HealthService } from './health-service.js'

describe('HealthService', () => {
  const healthService = new HealthService()

  beforeEach(() => {
    vi.clearAllMocks()
    getInstanceMock.mockReturnValue({
      query: queryMock
    })
  })

  test('deve retornar true quando banco responder', async () => {
    queryMock.mockResolvedValue([[{ '1': 1 }]])

    const result = await healthService.checkDatabase()

    expect(getInstanceMock).toHaveBeenCalled()
    expect(queryMock).toHaveBeenCalledWith('SELECT 1')
    expect(result).toBe(true)
  })

  test('deve retornar false quando banco falhar', async () => {
    queryMock.mockRejectedValue(new Error('Connection refused'))

    const result = await healthService.checkDatabase()

    expect(result).toBe(false)
  })
})
