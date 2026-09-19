import dotenv from 'dotenv'

dotenv.config()

export interface AppConfig {
  port: number
  nodeEnv: string
  corsOrigin: string
  demoMode: boolean
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoMode: process.env.DEMO_MODE !== 'false', // Defaults to true in prototype
}
