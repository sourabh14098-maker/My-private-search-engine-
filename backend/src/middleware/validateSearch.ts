import type { Request, Response, NextFunction } from 'express'
import { SUPPORTED_VERTICALS, type SearchVertical } from '../types/api.js'

export function validateSearchRequest(req: Request, res: Response, next: NextFunction): void {
  const queryParam = req.query.q

  // Validate presence of search query
  if (queryParam === undefined || queryParam === null) {
    res.status(400).json({
      error: true,
      code: 'INVALID_QUERY',
      message: "Query parameter 'q' is required. Example: /api/search?q=technology",
      statusCode: 400,
      timestamp: new Date().toISOString(),
    })
    return
  }

  const query = String(queryParam).trim()

  if (query.length === 0) {
    res.status(400).json({
      error: true,
      code: 'INVALID_QUERY',
      message: "Query parameter 'q' cannot be empty or whitespace only.",
      statusCode: 400,
      timestamp: new Date().toISOString(),
    })
    return
  }

  if (query.length > 500) {
    res.status(400).json({
      error: true,
      code: 'INVALID_QUERY',
      message: "Query parameter 'q' exceeds maximum allowed length of 500 characters.",
      statusCode: 400,
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Validate vertical parameter if provided (support 'vertical', 'mode', or shorthand 'v')
  const rawVertical = (req.query.vertical || req.query.mode || req.query.v || 'all') as string
  const normalizedVertical = rawVertical.toLowerCase().trim() as SearchVertical

  if (!SUPPORTED_VERTICALS.includes(normalizedVertical)) {
    res.status(400).json({
      error: true,
      code: 'INVALID_VERTICAL',
      message: `Unsupported vertical '${rawVertical}'. Supported verticals are: ${SUPPORTED_VERTICALS.join(', ')}.`,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Attach sanitized query & vertical to request
  req.query.q = query
  req.query.vertical = normalizedVertical
  req.query.v = normalizedVertical

  next()
}
