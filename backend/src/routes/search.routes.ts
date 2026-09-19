import { Router } from 'express'
import { handleSearch } from '../controllers/search.controller.js'
import { validateSearchRequest } from '../middleware/validateSearch.js'

const router = Router()

router.get('/', validateSearchRequest, handleSearch)

export default router
