import { validCategories, validCounts, validGenders, validRelationships } from '../utils/constants.js'

export function cleanText(value, max = 120) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
}

export function validateQuizCreation(req, res, next) {
  const { creatorName, gender, relationshipType, questionIds, questionConfigs, customQuestions = [], questionOrder } = req.body
  if (!cleanText(creatorName, 80) || (gender !== undefined && gender !== null && !validGenders.includes(gender)) || !validRelationships.includes(relationshipType) || !Array.isArray(questionIds) || !Array.isArray(customQuestions) || !validCounts.includes(questionIds.length + customQuestions.length)) {
    return res.status(400).json({ message: 'Add your name, choose a relationship, and select 10 questions.' })
  }
  if (customQuestions.some(item => !cleanText(item?.question, 240) || !Array.isArray(item.options) || item.options.length !== 4 ||
    item.options.some(option => !cleanText(option?.text, 160) || (option.imageUrl !== undefined && typeof option.imageUrl !== 'string')) ||
    !Number.isInteger(item.correctAnswer) || item.correctAnswer < 0 || item.correctAnswer > 3)) {
    return res.status(400).json({ message: 'Complete each custom question with four answers and one correct answer.' })
  }
  if (new Set(questionIds).size !== questionIds.length || questionIds.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) {
    return res.status(400).json({ message: 'Some selected questions are invalid.' })
  }
  if (questionOrder !== undefined && (!Array.isArray(questionOrder) || questionOrder.length !== questionIds.length + customQuestions.length ||
    questionOrder.some(item => !item || !['normal', 'custom'].includes(item.type) || typeof item.questionId !== 'string' || !item.questionId))) {
    return res.status(400).json({ message: 'The selected question order is invalid.' })
  }
  if (questionConfigs !== undefined && (!Array.isArray(questionConfigs) || questionConfigs.length !== questionIds.length ||
    questionConfigs.some(item => !item || item.questionId !== questionIds[questionConfigs.indexOf(item)] || !Number.isInteger(item.correctAnswer) || item.correctAnswer < 0 || item.correctAnswer > 3))) {
    return res.status(400).json({ message: 'Choose the correct answer for every question.' })
  }
  return next()
}

export function validateQuizSubmission(req, res, next) {
  const { playerName, answers } = req.body
  if (!cleanText(playerName, 30) || playerName.trim().length < 2 || !Array.isArray(answers) || answers.length < 1 || answers.length > 15) {
    return res.status(400).json({ message: 'Enter your name and answer every question.' })
  }
  if (answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer > 3)) {
    return res.status(400).json({ message: 'Every answer must be one of the four options.' })
  }
  return next()
}

export function validateQuestionQuery(req, res, next) {
  const { relationshipType, category, limit, sample } = req.query
  if (relationshipType && String(relationshipType).toLowerCase() !== 'all' && !validRelationships.includes(String(relationshipType).toLowerCase())) {
    return res.status(400).json({ message: 'Choose a valid relationship type.' })
  }
  if (category && !validCategories.includes(String(category).toUpperCase())) {
    return res.status(400).json({ message: 'Choose a valid question category.' })
  }
  if (limit !== undefined) {
    const parsedLimit = Number(limit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 60) {
      return res.status(400).json({ message: 'Question limit must be between 1 and 60.' })
    }
  }
  if (sample !== undefined && !['true', 'false'].includes(String(sample))) {
    return res.status(400).json({ message: 'Sample must be true or false.' })
  }
  return next()
}

export function validateSlugParam(req, res, next) {
  if (!/^[A-Za-z0-9_-]{6,7}$/.test(req.params.slug)) return res.status(404).json({ message: 'Quiz not found.' })
  return next()
}

export function validateResponseIdParam(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.responseId)) return res.status(404).json({ message: 'Result not found.' })
  return next()
}

export function validateManageToken(req, res, next) {
  if (!/^[A-Za-z0-9_-]{32}$/.test(req.params.manageToken)) return res.status(404).json({ message: 'Creator dashboard not found.' })
  return next()
}
