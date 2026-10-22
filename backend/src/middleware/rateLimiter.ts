import type { Request, Response, NextFunction } from 'express'
import type { ApiErrorResponse } from '../types/api.js'

export interface RateLimitOptions {
  windowMs: number
  max: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

export function createRateLimiter(options: RateLimitOptions) {
  const hits = new Map<string, RateLimitRecord>()

  // Cleanup expired entries every 2 minutes to prevent unbounded memory growth
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, val] of hits.entries()) {
      if (now > val.resetTime) {
        hits.delete(key)
      }
    }
  }, 2 * 60 * 1000)
  timer.unref()

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Skip rate limiting in automated tests unless explicitly requested via test header
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      next()
      return
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1'
    const now = Date.now()
    const record = hits.get(ip)

    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + options.windowMs })
      res.setHeader('RateLimit-Limit', options.max)
      res.setHeader('RateLimit-Remaining', options.max - 1)
      res.setHeader('RateLimit-Reset', Math.ceil((now + options.windowMs) / 1000))
      next()
      return
    }

    if (record.count >= options.max) {
      const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
      res.setHeader('Retry-After', retryAfter)
      res.setHeader('RateLimit-Limit', options.max)
      res.setHeader('RateLimit-Remaining', 0)
      res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000))

      const errorResponse: ApiErrorResponse = {
        error: true,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many search requests. Please slow down and try again shortly.',
        statusCode: 429,
        timestamp: new Date().toISOString(),
      }

      res.status(429).json(errorResponse)
      return
    }

    record.count += 1
    res.setHeader('RateLimit-Limit', options.max)
    res.setHeader('RateLimit-Remaining', Math.max(0, options.max - record.count))
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000))
    next()
  }
}

// Default search rate limiter: 60 requests per minute per IP
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
})
