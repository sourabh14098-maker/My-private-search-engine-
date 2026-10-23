import type { Request, Response } from 'express'
import { config } from '../config.js'
import type { HealthApiResponse } from '../types/api.js'

const startTime = Date.now()

export function getHealth(_req: Request, res: Response): void {
  const isConfigured =
    config.searchProvider === 'mock'
      ? true
      : config.searchProvider === 'brave'
      ? Boolean(config.braveApiKey)
      : config.searchProvider === 'searxng'
      ? Boolean(config.searxngUrl)
      : false

  const response: HealthApiResponse = {
    status: isConfigured ? 'healthy' : 'degraded',
    service: 'Ditch Google!R! Search Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    version: '0.2.0',
    environment: config.nodeEnv,
    demoMode: config.demoMode,
    searchProvider: config.searchProvider,
    providerConfigured: isConfigured,
    aiProvider: config.aiProvider,
    aiConfigured:
      config.aiProvider === 'ollama'
        ? Boolean(config.ollamaModel)
        : config.aiProvider !== 'none',
    aiModel: config.aiProvider === 'ollama' ? config.ollamaModel || undefined : undefined,
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
