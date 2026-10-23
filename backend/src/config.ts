import dotenv from 'dotenv'

dotenv.config()

export type SearchProviderType = 'mock' | 'brave' | 'searxng'
export type AIProviderType = 'none' | 'ollama' | 'openai' | 'custom'

export interface AppConfig {
  port: number
  nodeEnv: string
  corsOrigin: string
  demoMode: boolean
  searchProvider: SearchProviderType
  aiProvider: AIProviderType
  braveApiKey: string
  braveApiUrl: string
  searxngUrl: string
  searchTimeoutMs: number
  ollamaBaseUrl: string
  ollamaModel: string
  ollamaTimeoutMs: number
}

// Resolves active search provider: mock, brave, or local searxng
const rawProvider = (process.env.SEARCH_PROVIDER || '').toLowerCase().trim()
const searchProvider: SearchProviderType =
  rawProvider === 'brave' || rawProvider === 'mock' || rawProvider === 'searxng'
    ? rawProvider
    : process.env.DEMO_MODE === 'false'
    ? 'brave'
    : 'mock'

// Resolves active AI inference provider (default: 'none' to preserve user privacy)
const rawAIProvider = (process.env.AI_PROVIDER || 'none').toLowerCase().trim()
const aiProvider: AIProviderType =
  rawAIProvider === 'ollama' || rawAIProvider === 'openai' || rawAIProvider === 'custom'
    ? rawAIProvider
    : 'none'

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoMode: process.env.DEMO_MODE !== 'false', // Defaults to true in prototype
  searchProvider,
  aiProvider,
  braveApiKey: (process.env.BRAVE_SEARCH_API_KEY || '').trim(),
  braveApiUrl: process.env.BRAVE_SEARCH_API_URL || 'https://api.search.brave.com/res/v1/web/search',
  searxngUrl: (process.env.SEARXNG_URL || '').trim(),
  searchTimeoutMs: parseInt(process.env.SEARCH_TIMEOUT_MS || '5000', 10),
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/+$/, ''),
  ollamaModel: (process.env.OLLAMA_MODEL || '').trim(),
  ollamaTimeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '15000', 10),
}

