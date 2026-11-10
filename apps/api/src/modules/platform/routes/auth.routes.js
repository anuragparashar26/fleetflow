import express from 'express'
const router = express.Router()

import authMiddleware from "../../../middleware/auth.middleware.js"
import { syncUser, getMe } from "../controllers/auth.controller.js"

router.post('/sync', authMiddleware, syncUser)
router.get('/me', authMiddleware, getMe)

export default router