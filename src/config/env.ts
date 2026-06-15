import { config } from 'dotenv'

config()

const DEFAULT_JWT_SECRET = 'your_secret_key'
const isProduction = process.env.NODE_ENV === 'production'

function requireProductionEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required when NODE_ENV=production`)
  }

  return value
}

export function validateProductionEnv(): void {
  if (!isProduction) {
    return
  }

  requireProductionEnv('DB_HOST', process.env.DB_HOST)
  requireProductionEnv('DB_USER', process.env.DB_USER)
  requireProductionEnv('DB_PASSWORD', process.env.DB_PASSWORD)
  requireProductionEnv('DB_NAME', process.env.DB_NAME)

  if (!process.env.DB_PORT) {
    throw new Error('DB_PORT is required when NODE_ENV=production')
  }

  const jwtSecret = requireProductionEnv('JWT_SECRET', process.env.JWT_SECRET)

  if (jwtSecret === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set to a strong value in production')
  }
}

function resolveApiBaseUrl(): string {
  const configured = process.env.API_BASE_URL ?? process.env.RENDER_EXTERNAL_URL

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const port = process.env.PORT ?? '3000'
  return `http://localhost:${port}`
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  apiBaseUrl: resolveApiBaseUrl(),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3307),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME ?? 'tickets'
  }
}
