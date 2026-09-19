import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { privacyLogger } from './middleware/privacyLogger.js'
import { errorHandler, AppError } from './middleware/errorHandler.js'
import apiRoutes from './routes/index.js'

export function createApp(): express.Application {
  const app = express()

  // Security & Privacy HTTP Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'interest-cohort=()')
    next()
  })

  // CORS Configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? '*' : config.corsOrigin,
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
    })
  )

  // Body parser with tight payload limits
  app.use(express.json({ limit: '64kb' }))
  app.use(express.urlencoded({ extended: false, limit: '64kb' }))

  // Privacy-first request logger (no query, no IP, no user agent)
  app.use(privacyLogger)

  // Mount API routes
  app.use('/api', apiRoutes)

  // Root welcome / status
  app.get('/', (_req, res) => {
    res.json({
      service: 'Ditch Google!R! Search Backend Foundation',
      version: '0.2.0',
      healthEndpoint: '/api/health',
      searchEndpoint: '/api/search?q={query}&v={vertical}',
      docs: 'See README.md for architecture and endpoint specifications.',
    })
  })

  // 404 Not Found handler
  app.use((req, _res, next) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.path}`, 404, 'NOT_FOUND'))
  })

  // Centralized error handling
  app.use(errorHandler)

  return app
}

export const app = createApp()
export default app
