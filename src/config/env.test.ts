import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('validateProductionEnv', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  test('não deve lançar erro fora de produção com valores padrão', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    const { validateProductionEnv } = await import('./env.js')

    expect(() => validateProductionEnv()).not.toThrow()
  })

  test('deve exigir DB_HOST em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', 'strong-production-secret')
    vi.stubEnv('DB_HOST', '')
    vi.stubEnv('DB_PORT', '3306')
    vi.stubEnv('DB_USER', 'root')
    vi.stubEnv('DB_PASSWORD', 'secret')
    vi.stubEnv('DB_NAME', 'tickets')

    const { validateProductionEnv } = await import('./env.js')

    expect(() => validateProductionEnv()).toThrow('DB_HOST is required when NODE_ENV=production')
  })

  test('deve exigir DB_PORT em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', 'strong-production-secret')
    vi.stubEnv('DB_HOST', 'mysql.example.com')
    vi.stubEnv('DB_USER', 'root')
    vi.stubEnv('DB_PASSWORD', 'secret')
    vi.stubEnv('DB_NAME', 'tickets')
    vi.stubEnv('DB_PORT', '')

    const { validateProductionEnv } = await import('./env.js')

    expect(() => validateProductionEnv()).toThrow('DB_PORT is required when NODE_ENV=production')
  })

  test('deve rejeitar JWT_SECRET padrão em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DB_HOST', 'mysql.example.com')
    vi.stubEnv('DB_PORT', '3306')
    vi.stubEnv('DB_USER', 'root')
    vi.stubEnv('DB_PASSWORD', 'secret')
    vi.stubEnv('DB_NAME', 'tickets')
    vi.stubEnv('JWT_SECRET', 'your_secret_key')

    const { validateProductionEnv } = await import('./env.js')

    expect(() => validateProductionEnv()).toThrow(
      'JWT_SECRET must be set to a strong value in production'
    )
  })

  test('deve validar produção com variáveis completas', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DB_HOST', 'mysql.example.com')
    vi.stubEnv('DB_PORT', '3306')
    vi.stubEnv('DB_USER', 'root')
    vi.stubEnv('DB_PASSWORD', 'secret')
    vi.stubEnv('DB_NAME', 'tickets')
    vi.stubEnv('JWT_SECRET', 'strong-production-secret')

    const { validateProductionEnv } = await import('./env.js')

    expect(() => validateProductionEnv()).not.toThrow()
  })
})
