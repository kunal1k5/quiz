import { Question } from '../models/index.js'
import { relationshipQuestionTypes } from '../utils/constants.js'

export async function listQuestions(req, res) {
  try {
    const filter = { active: true }
    if (req.query.category && req.query.category.toUpperCase() !== 'ALL') filter.category = String(req.query.category).toUpperCase()
    if (req.query.relationshipType && req.query.relationshipType.toLowerCase() !== 'all') {
      const relationship = String(req.query.relationshipType).toLowerCase()
      const relationshipType = relationshipQuestionTypes[relationship] || relationship
      filter.relationshipType = { $in: [relationshipType, 'all'] }
    }
    const limit = Number(req.query.limit) || 40
    const sample = String(req.query.sample) === 'true'
    const questions = sample
      ? await Question.aggregate([
          { $match: filter },
          { $sample: { size: limit } },
          { $project: { _id: 1, question: 1, options: 1, category: 1, relationshipType: 1 } },
        ])
      : await Question.find(filter).select('_id question options category relationshipType').sort({ createdAt: 1 }).limit(limit).lean()
    return res.json({ questions })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load the question bank.' })
  }
}
