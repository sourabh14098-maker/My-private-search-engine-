import { Router } from 'express'
import healthRoutes from './health.routes.js'
import searchRoutes from './search.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/search', searchRoutes)

export default router
