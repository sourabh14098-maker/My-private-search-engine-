import type { Request, Response } from 'express'
import { config } from '../config.js'
import type { HealthApiResponse } from '../types/api.js'

const startTime = Date.now()

export function getHealth(_req: Request, res: Response): void {
  const response: HealthApiResponse = {
    status: 'healthy',
    service: 'Ditch Google!R! Search Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    version: '0.2.0',
    environment: config.nodeEnv,
    demoMode: config.demoMode,
    searchProvider: config.searchProvider,
    providerConfigured: config.searchProvider === 'mock' || Boolean(config.braveApiKey),
    supportedVerticals: [
      'all',
      'images',
      'videos',
      'news',
      'maps',
      'shopping',
      'books',
      'ai',
    ],
  }
  res.status(200).json(response)
}
