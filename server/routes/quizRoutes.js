import { Router } from 'express'
import { createQuiz, getLeaderboard, getManageDashboard, getManageSubmission, getPublicQuiz, getQuiz, getResponseResult, submitQuiz } from '../controllers/quizController.js'
import { validateManageToken, validateQuizCreation, validateQuizSubmission, validateResponseIdParam, validateSlugParam } from '../middleware/validation.js'
import { submissionRateLimit } from '../middleware/rateLimit.js'

const router = Router()
router.post('/', validateQuizCreation, createQuiz)
router.get('/public/:slug', validateSlugParam, getPublicQuiz)
router.get('/manage/:manageToken', validateManageToken, getManageDashboard)
router.get('/manage/:manageToken/submissions/:submissionId', validateManageToken, validateResponseIdParam, getManageSubmission)
router.get('/:slug/leaderboard', validateSlugParam, getLeaderboard)
router.get('/:slug/responses/:responseId', validateSlugParam, validateResponseIdParam, getResponseResult)
router.get('/:slug', validateSlugParam, getQuiz)
router.post('/:slug/submit', validateSlugParam, submissionRateLimit, validateQuizSubmission, submitQuiz)
export default router
