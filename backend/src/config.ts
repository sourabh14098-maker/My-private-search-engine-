import dotenv from 'dotenv'

dotenv.config()

export type SearchProviderType = 'mock' | 'brave'

export interface AppConfig {
  port: number
  nodeEnv: string
  corsOrigin: string
  demoMode: boolean
  searchProvider: SearchProviderType
  braveApiKey: string
  braveApiUrl: string
  searchTimeoutMs: number
}

const rawProvider = (process.env.SEARCH_PROVIDER || '').toLowerCase().trim()
const searchProvider: SearchProviderType =
  rawProvider === 'brave' || rawProvider === 'mock'
    ? rawProvider
    : process.env.DEMO_MODE === 'false'
    ? 'brave'
    : 'mock'

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoMode: process.env.DEMO_MODE !== 'false', // Defaults to true in prototype
  searchProvider,
  braveApiKey: (process.env.BRAVE_SEARCH_API_KEY || '').trim(),
  braveApiUrl: process.env.BRAVE_SEARCH_API_URL || 'https://api.search.brave.com/res/v1/web/search',
  searchTimeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '5000', 10),
}
