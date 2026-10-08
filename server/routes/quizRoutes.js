import { Router } from 'express'
import { createQuiz, getLeaderboard, getLikes, getManageDashboard, getManageSubmission, getPublicQuiz, getQuiz, getResponseResult, likeQuiz, submitQuiz } from '../controllers/quizController.js'
import { validateClientId, validateManageToken, validateQuizCreation, validateQuizSubmission, validateResponseIdParam, validateSlugParam } from '../middleware/validation.js'
import { likeRateLimit, submissionRateLimit } from '../middleware/rateLimit.js'

const router = Router()
router.post('/', validateQuizCreation, createQuiz)
router.get('/public/:slug', validateSlugParam, getPublicQuiz)
router.get('/:slug/likes', validateSlugParam, getLikes)
router.post('/:slug/like', validateSlugParam, validateClientId, likeRateLimit, likeQuiz)
router.get('/manage/:manageToken', validateManageToken, getManageDashboard)
router.get('/manage/:manageToken/submissions/:submissionId', validateManageToken, validateResponseIdParam, getManageSubmission)
router.get('/:slug/leaderboard', validateSlugParam, getLeaderboard)
router.get('/:slug/responses/:responseId', validateSlugParam, validateResponseIdParam, getResponseResult)
router.get('/:slug', validateSlugParam, getQuiz)
router.post('/:slug/submit', validateSlugParam, submissionRateLimit, validateQuizSubmission, submitQuiz)
export default router
