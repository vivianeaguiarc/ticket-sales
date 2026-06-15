import { beforeEach, describe, expect, test, vi } from 'vitest'

const { createPoolMock } = vi.hoisted(() => {
  return {
    createPoolMock: vi.fn()
  }
})

vi.mock('mysql2/promise', () => {
  return {
    createPool: createPoolMock
  }
})

import { env } from './config/env.js'
import { Database } from './database.js'

describe('Database (Singleton)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(Database as unknown as { instance?: unknown }).instance = undefined
  })

  test('deve criar uma nova instância do pool na primeira chamada', () => {
    const fakePool = { fake: true }

    createPoolMock.mockReturnValue(fakePool)

    const instance = Database.getInstance()

    expect(createPoolMock).toHaveBeenCalledTimes(1)
    expect(createPoolMock).toHaveBeenCalledWith({
      host: env.db.host,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      port: env.db.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
    expect(instance).toBe(fakePool)
  })

  test('deve reutilizar a mesma instância nas chamadas seguintes', () => {
    const fakePool = { fake: true }

    createPoolMock.mockReturnValue(fakePool)

    const firstInstance = Database.getInstance()
    const secondInstance = Database.getInstance()

    expect(createPoolMock).toHaveBeenCalledTimes(1)
    expect(firstInstance).toBe(secondInstance)
  })
})
