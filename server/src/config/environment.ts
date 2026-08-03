export interface AppEnvironment {
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  API_PREFIX: string
  CORS_ORIGINS: string
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_ACCESS_TTL_SECONDS: number
  JWT_REFRESH_TTL_SECONDS: number
  COOKIE_SECURE: boolean
  COOKIE_SAME_SITE: 'lax' | 'strict' | 'none'
  PASSWORD_HASH_ROUNDS: number
  AGENT_PROVIDER: 'local' | 'deepseek'
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
  DEEPSEEK_MODEL: string
  DEEPSEEK_TIMEOUT_MS: number
}

function parseInteger(
  value: unknown,
  fallback: number,
  key: string,
  min: number,
  max: number,
): number {
  const parsed = Number(value ?? fallback)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`)
  }
  return parsed
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  if (String(value).toLowerCase() === 'true') return true
  if (String(value).toLowerCase() === 'false') return false
  throw new Error(`Expected a boolean value, received "${String(value)}"`)
}

export function validateEnvironment(input: Record<string, unknown>): AppEnvironment {
  const nodeEnv = String(input.NODE_ENV ?? 'development')
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production')
  }

  const databaseUrl = String(input.DATABASE_URL ?? '').trim()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const jwtSecret = String(input.JWT_SECRET ?? 'development-only-secret-change-before-production')
  if (nodeEnv === 'production' && jwtSecret === 'development-only-secret-change-before-production') {
    throw new Error('JWT_SECRET must be configured in production')
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters')
  }

  const cookieSameSite = String(input.COOKIE_SAME_SITE ?? 'lax').toLowerCase()
  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none')
  }

  const cookieSecure = parseBoolean(input.COOKIE_SECURE, nodeEnv === 'production')
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is none')
  }

  const agentProvider = String(input.AGENT_PROVIDER ?? 'local').toLowerCase()
  if (!['local', 'deepseek'].includes(agentProvider)) {
    throw new Error('AGENT_PROVIDER must be local or deepseek')
  }
  const deepseekApiKey = String(input.DEEPSEEK_API_KEY ?? '').trim()
  if (agentProvider === 'deepseek' && !deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY is required when AGENT_PROVIDER is deepseek')
  }

  return {
    NODE_ENV: nodeEnv as AppEnvironment['NODE_ENV'],
    PORT: parseInteger(input.PORT, 8888, 'PORT', 1, 65535),
    API_PREFIX: String(input.API_PREFIX ?? 'api').replace(/^\/+|\/+$/g, ''),
    CORS_ORIGINS: String(input.CORS_ORIGINS ?? 'http://localhost:5273'),
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_ACCESS_TTL_SECONDS: parseInteger(
      input.JWT_ACCESS_TTL_SECONDS,
      7200,
      'JWT_ACCESS_TTL_SECONDS',
      60,
      86400,
    ),
    JWT_REFRESH_TTL_SECONDS: parseInteger(
      input.JWT_REFRESH_TTL_SECONDS,
      2592000,
      'JWT_REFRESH_TTL_SECONDS',
      3600,
      7776000,
    ),
    COOKIE_SECURE: cookieSecure,
    COOKIE_SAME_SITE: cookieSameSite as AppEnvironment['COOKIE_SAME_SITE'],
    PASSWORD_HASH_ROUNDS: parseInteger(
      input.PASSWORD_HASH_ROUNDS,
      12,
      'PASSWORD_HASH_ROUNDS',
      10,
      15,
    ),
    AGENT_PROVIDER: agentProvider as AppEnvironment['AGENT_PROVIDER'],
    DEEPSEEK_API_KEY: deepseekApiKey,
    DEEPSEEK_BASE_URL: String(input.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com')
      .trim()
      .replace(/\/+$/g, ''),
    DEEPSEEK_MODEL: String(input.DEEPSEEK_MODEL ?? 'deepseek-v4-flash').trim(),
    DEEPSEEK_TIMEOUT_MS: parseInteger(
      input.DEEPSEEK_TIMEOUT_MS,
      60000,
      'DEEPSEEK_TIMEOUT_MS',
      5000,
      180000,
    ),
  }
}
