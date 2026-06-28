import { Router } from 'express'
import adminRouter from './admin.js'
import kbRouter from './kb.js'
import statsRouter from './stats.js'
import skillRouter from './skill.js'
import diagRouter from './diag.js'

const router = Router()

router.use(adminRouter)
router.use(kbRouter)
router.use(statsRouter)
router.use(skillRouter)
router.use('/diag', diagRouter)

export default router