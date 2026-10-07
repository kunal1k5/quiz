import { Router } from 'express'
import { listQuestions } from '../controllers/questionController.js'
import { validateQuestionQuery } from '../middleware/validation.js'

const router = Router()
router.get('/', validateQuestionQuery, listQuestions)
export default router
