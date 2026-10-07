import { Question, Quiz, Response } from '../models/index.js'
import { createSlug } from '../utils/slug.js'
import { cleanText } from '../middleware/validation.js'
import { relationshipQuestionTypes } from '../utils/constants.js'
import { createManageToken } from '../utils/manageToken.js'

const publicQuiz = (quiz, questions) => ({
  quizId: quiz._id,
  slug: quiz.slug,
  creatorName: quiz.creatorName,
  relationshipType: quiz.relationshipType,
  resultTone: quiz.gender === 'male' || quiz.gender === 'female' ? quiz.gender : 'neutral',
  creatorGender: quiz.gender === 'male' || quiz.gender === 'female' ? quiz.gender : 'prefer_not_to_say',
  totalQuestions: questions.length,
  questions: questions.map(({ _id, question, options }) => ({ _id, question, options })),
})

const combinedQuestions = (quiz, bankQuestions) => [
  ...quiz.questionIds.map(id => bankQuestions.find(question => String(question._id) === String(id))).filter(Boolean),
  ...(quiz.customQuestions || []).map(question => ({ ...question, _id: question._id })),
]

async function loadPublicQuiz(slug) {
  const quiz = await Quiz.findOne({ slug }).lean()
  if (!quiz) return { status: 404, body: { message: 'Quiz not found.' } }
  if (!quiz.isActive) return { status: 410, body: { message: 'This quiz is no longer available.' } }
  const questions = await Question.find({ _id: { $in: quiz.questionIds }, active: true }).select('_id question category options').lean()
  const ordered = combinedQuestions(quiz, questions)
  if (ordered.length !== quiz.questionIds.length + (quiz.customQuestions || []).length) {
    return { status: 410, body: { message: 'This quiz is no longer available.' } }
  }
  return { status: 200, quiz, questions: ordered }
}

const resultPayload = (response, quiz, questions) => ({
  responseId: response._id,
  score: response.score,
  percentage: response.percentage,
  totalQuestions: questions.length,
  playerName: response.playerName,
  creatorName: quiz.creatorName,
  relationshipType: quiz.relationshipType,
  creatorGender: quiz.gender === 'male' || quiz.gender === 'female' ? quiz.gender : 'prefer_not_to_say',
  review: questions.map((question, index) => ({
    question: question.question,
    selected: response.answers[index],
    selectedAnswer: Array.isArray(question.options)
      ? question.options[response.answers[index]]?.text || question.options[response.answers[index]] || ''
      : '',
    correct: response.answers[index] === (question._isCustom
      ? question.correctAnswer
      : quiz.questionConfigs?.length
        ? quiz.questionConfigs.find(item => String(item.questionId) === String(question._id))?.correctAnswer
        : question.correctAnswer),
  })),
})

export async function createQuiz(req, res) {
  try {
    const { creatorName, gender = null, relationshipType, questionIds, questionConfigs, customQuestions = [] } = req.body
    const questionRelationship = relationshipQuestionTypes[relationshipType] || relationshipType
    const questions = await Question.find({ _id: { $in: questionIds }, active: true, relationshipType: { $in: [questionRelationship, 'all'] } }).select('_id')
    if (questions.length !== questionIds.length) return res.status(400).json({ message: 'One or more selected questions are unavailable.' })
    const quiz = await Quiz.create({ slug: createSlug(), manageToken: createManageToken(), creatorName: creatorName.trim(), gender, relationshipType, questionIds, questionConfigs, customQuestions })
    const baseUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5173')
    return res.status(201).json({
      quizId: quiz._id,
      slug: quiz.slug,
      manageToken: quiz.manageToken,
      creatorName: quiz.creatorName,
      relationshipType: quiz.relationshipType,
      shareUrl: `${baseUrl}/quiz/${quiz.slug}`,
      manageUrl: `${baseUrl}/quiz/manage/${quiz.manageToken}`,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to create your quiz.' })
  }
}

export async function getQuiz(req, res) {
  try {
    const result = await loadPublicQuiz(req.params.slug)
    if (result.status !== 200) return res.status(result.status).json(result.body)
    return res.json(publicQuiz(result.quiz, result.questions))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load your quiz.' })
  }
}

export async function getPublicQuiz(req, res) {
    try {
      const result = await loadPublicQuiz(req.params.slug)
      if (result.status !== 200) return res.status(result.status).json(result.body)
      return res.json({ success: true, quiz: publicQuiz(result.quiz, result.questions) })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Unable to load your quiz.' })
  }
}

export async function submitQuiz(req, res) {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
    if (!quiz.isActive) return res.status(410).json({ message: 'This quiz is no longer available.' })
    const { playerName, answers } = req.body
    const totalQuestions = quiz.questionIds.length + (quiz.customQuestions || []).length
    if (!cleanText(playerName, 80) || !Array.isArray(answers) || answers.length !== totalQuestions || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)) {
      return res.status(400).json({ message: 'Enter your name and answer every question.' })
    }
    const questions = await Question.find({ _id: { $in: quiz.questionIds }, active: true }).select('+correctAnswer _id question options').lean()
    const ordered = combinedQuestions(quiz, questions)
    if (ordered.length !== totalQuestions) return res.status(410).json({ message: 'This quiz is no longer available.' })
    ordered.forEach(question => { if (quiz.customQuestions?.some(custom => String(custom._id) === String(question._id))) question._isCustom = true })
    const configuredAnswers = quiz.questionConfigs?.length
      ? new Map(quiz.questionConfigs.map(item => [String(item.questionId), item.correctAnswer]))
      : null
    const score = ordered.reduce((total, question, index) => {
      const correctAnswer = configuredAnswers?.get(String(question._id)) ?? question.correctAnswer
      return total + (answers[index] === correctAnswer ? 1 : 0)
    }, 0)
    const percentage = Math.round((score / ordered.length) * 100)
    const response = await Response.create({ quizId: quiz._id, playerName: playerName.trim(), answers, score, percentage })
    return res.json(resultPayload(response, quiz, ordered))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to submit your quiz.' })
  }
}

export async function getResponseResult(req, res) {
  try {
    const quiz = await Quiz.findOne({ slug: req.params.slug })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
    if (!quiz.isActive) return res.status(410).json({ message: 'This quiz is no longer available.' })
    const response = await Response.findOne({ _id: req.params.responseId, quizId: quiz._id }).lean()
    if (!response) return res.status(404).json({ message: 'Result not found.' })
    const questions = await Question.find({ _id: { $in: quiz.questionIds }, active: true }).select('+correctAnswer _id question options').lean()
    const ordered = combinedQuestions(quiz, questions)
    if (ordered.length !== quiz.questionIds.length + (quiz.customQuestions || []).length) return res.status(410).json({ message: 'This quiz is no longer available.' })
    ordered.forEach(question => { if (quiz.customQuestions?.some(custom => String(custom._id) === String(question._id))) question._isCustom = true })
    return res.json(resultPayload(response, quiz, ordered))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load this result.' })
  }
}

export async function getLeaderboard(req, res) {
    try {
      const quiz = await Quiz.findOne({ slug: req.params.slug }).select('_id creatorName relationshipType questionIds customQuestions').lean()
      if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
      const entries = await Response.find({ quizId: quiz._id }).sort({ score: -1, completedAt: 1 }).select('playerName score percentage completedAt').limit(100).lean()
      return res.json({ creatorName: quiz.creatorName, relationshipType: quiz.relationshipType, totalQuestions: quiz.questionIds.length + (quiz.customQuestions?.length || 0), entries: entries.map((entry, index) => ({ responseId: entry._id, rank: index + 1, playerName: entry.playerName, score: entry.score, percentage: entry.percentage, completedAt: entry.completedAt })) })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Unable to load the leaderboard.' })
    }
  }

export async function getResults(req, res) {
    try {
      const quiz = await Quiz.findOne({ slug: req.params.slug }).select('_id creatorName relationshipType questionIds customQuestions').lean()
      if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
      const entries = await Response.find({ quizId: quiz._id }).sort({ score: -1, completedAt: 1 }).select('playerName score percentage completedAt').limit(100).lean()
      const totalPlayers = entries.length
      const averageScore = totalPlayers ? Math.round((entries.reduce((sum, entry) => sum + entry.score, 0) / totalPlayers) * 10) / 10 : 0
      return res.json({ creatorName: quiz.creatorName, relationshipType: quiz.relationshipType, totalQuestions: quiz.questionIds.length + (quiz.customQuestions?.length || 0), totalPlayers, averageScore, highestScore: totalPlayers ? entries[0].score : 0, lowestScore: totalPlayers ? entries[entries.length - 1].score : 0, entries: entries.map((entry, index) => ({ responseId: entry._id, rank: index + 1, playerName: entry.playerName, score: entry.score, percentage: entry.percentage, completedAt: entry.completedAt })) })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Unable to load quiz results.' })
    }
  }

export async function getSubmissions(req, res) {
      try {
        const quiz = await Quiz.findOne({ slug: req.params.slug }).select('_id questionIds customQuestions').lean()
        if (!quiz) return res.status(404).json({ message: 'Quiz not found.' })
        const totalQuestions = quiz.questionIds.length + (quiz.customQuestions?.length || 0)
        const submissions = await Response.find({ quizId: quiz._id })
          .sort({ completedAt: -1 })
          .select('playerName score percentage completedAt')
          .limit(100)
          .lean()
        return res.json({
          success: true,
          submissions: submissions.map(entry => ({
            playerName: entry.playerName,
            score: entry.score,
            totalQuestions,
            percentage: entry.percentage,
            completedAt: entry.completedAt,
          })),
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Unable to load quiz submissions.' })
      }
    }

    export async function getManageDashboard(req, res) {
      try {
        const quiz = await Quiz.findOne({ manageToken: req.params.manageToken }).select('_id slug creatorName relationshipType questionIds customQuestions').lean()
        if (!quiz) return res.status(404).json({ message: 'Creator dashboard not found.' })
        const totalQuestions = quiz.questionIds.length + (quiz.customQuestions?.length || 0)
        const submissions = await Response.find({ quizId: quiz._id }).sort({ score: -1, completedAt: 1 }).select('playerName score percentage completedAt').limit(100).lean()
        return res.json({
          success: true,
          quiz: { slug: quiz.slug, creatorName: quiz.creatorName, relationshipType: quiz.relationshipType, totalQuestions },
          submissions: submissions.map(entry => ({ submissionId: entry._id, playerName: entry.playerName, score: entry.score, totalQuestions, percentage: entry.percentage, completedAt: entry.completedAt })),
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Unable to load creator results.' })
      }
    }

    export async function getManageSubmission(req, res) {
      try {
        const quiz = await Quiz.findOne({ manageToken: req.params.manageToken }).lean()
        if (!quiz) return res.status(404).json({ message: 'Creator dashboard not found.' })
        const response = await Response.findOne({ _id: req.params.submissionId, quizId: quiz._id }).lean()
        if (!response) return res.status(404).json({ message: 'Submission not found.' })
        const questions = await Question.find({ _id: { $in: quiz.questionIds }, active: true }).select('+correctAnswer _id question options').lean()
        const ordered = combinedQuestions(quiz, questions)
        if (ordered.length !== quiz.questionIds.length + (quiz.customQuestions || []).length) return res.status(410).json({ message: 'This quiz is no longer available.' })
        ordered.forEach(question => { if (quiz.customQuestions?.some(custom => String(custom._id) === String(question._id))) question._isCustom = true })
        return res.json({ success: true, result: resultPayload(response, quiz, ordered) })
      } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Unable to load this submission.' })
      }
    }
