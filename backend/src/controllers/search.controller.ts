import type { Request, Response, NextFunction } from 'express'
import { searchService } from '../services/search.service.js'
import type { SearchVertical } from '../types/api.js'

export async function handleSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (req.query.q as string).trim()
    const vertical = ((req.query.v as string) || 'all').toLowerCase() as SearchVertical

    const results = await searchService.search(query, vertical)
    res.status(200).json(results)
  } catch (err) {
    next(err)
  }
}
