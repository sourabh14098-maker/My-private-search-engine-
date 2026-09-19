import { app } from './app.js'
import { config } from './config.js'

const server = app.listen(config.port, () => {
  console.log(`[DitchX Backend] Service running on http://localhost:${config.port}`)
  console.log(`[DitchX Backend] Environment: ${config.nodeEnv}`)
  console.log(`[DitchX Backend] Demo mode: ${config.demoMode ? 'ENABLED (prototype data)' : 'DISABLED (real index expected)'}`)
  console.log(`[DitchX Backend] Health endpoint: http://localhost:${config.port}/api/health`)
  console.log(`[DitchX Backend] Search endpoint: http://localhost:${config.port}/api/search?q=privacy&v=all`)
})

function shutdown(signal: string) {
  console.log(`\n[DitchX Backend] Received ${signal}. Gracefully shutting down...`)
  server.close(() => {
    console.log('[DitchX Backend] Server closed successfully.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
