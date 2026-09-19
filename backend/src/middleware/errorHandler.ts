import type { Request, Response, NextFunction } from 'express'
import type { ApiErrorResponse } from '../types/api.js'

export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500
  const code = 'code' in err && typeof err.code === 'string' ? err.code : (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR')
  const message = err.message || 'An unexpected error occurred.'

  const errorResponse: ApiErrorResponse = {
    error: true,
    code,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  }

  res.status(statusCode).json(errorResponse)
}
