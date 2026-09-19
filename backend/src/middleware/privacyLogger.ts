import type { Request, Response, NextFunction } from 'express'

/**
 * Privacy-preserving request logger.
 * Does NOT log search queries, personal identifiers, or IP addresses.
 * Only logs the HTTP method, endpoint path (query stripped), and response status code.
 */
export function privacyLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  const path = req.path

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    // Logging sanitized method, path, status, and duration
    // No query params (?q=...) or user IP are logged to prevent query profiling
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${path} -> ${status} (${duration}ms)`)
    }
  })

  next()
}
