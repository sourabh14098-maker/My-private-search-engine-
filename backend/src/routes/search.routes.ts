import { Router } from 'express'
import { handleSearch } from '../controllers/search.controller.js'
import { validateSearchRequest } from '../middleware/validateSearch.js'
import { searchRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.get('/', searchRateLimiter, validateSearchRequest, handleSearch)

export default router
