import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import questionRoutes from './routes/questionRoutes.js'
import quizRoutes from './routes/quizRoutes.js'
import Question from './models/Question.js'
import { questionBank } from './questionBank.js'

const app = express()
const port = process.env.PORT || 5000
const clientUrls = (process.env.CLIENT_URL || '').split(',').map(url => url.trim()).filter(Boolean)
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

function isAllowedOrigin(origin) {
  if (clientUrls.includes(origin)) return true
  if (process.env.NODE_ENV === 'production' || !origin) return false
  try {
    const url = new URL(origin)
    return url.hostname === 'localhost' && ['4173', '4174', '5173', '5174'].includes(url.port)
  } catch {
    return false
  }
}

app.set('trust proxy', 1)
app.use(express.json({ limit: '50kb' }))
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use('/api/questions', questionRoutes)
app.use('/api/quizzes', quizRoutes)
app.use(express.static(clientDist))
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))

export async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizly')
  const importedPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'questionBank.import.json')
  const additionalPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'questionBank.additional.json')
  let importedQuestions = []
  try {
    const source = JSON.parse(await fs.readFile(importedPath, 'utf8'))
    const categories = { deep: 'PERSONALITY', friends: 'FRIENDSHIP', bestie: 'BEST FRIEND', love: 'COUPLE', food: 'FOOD', funny: 'FUNNY', habits: 'HABITS', memories: 'MEMORIES', crush: 'CRUSH', family: 'FAMILY' }
    importedQuestions = source.map(item => ({
      category: categories[item.category] || String(item.category).toUpperCase(),
      relationshipType: 'all',
      question: item.question,
      options: item.options.map(option => ({ text: option.text, imageUrl: option.imageUrl || '' })),
      // Imported entries are question templates; Part 2 can replace this placeholder
      // when a creator supplies their personal answer.
      correctAnswer: Number.isInteger(item.correctAnswer) ? item.correctAnswer : 0,
      active: item.active !== false,
    }))
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Question bank import failed:', error)
  }
  let additionalQuestions = []
  try {
    const source = JSON.parse(await fs.readFile(additionalPath, 'utf8'))
    additionalQuestions = source.map(item => ({
      category: item.category,
      relationshipType: 'all',
      question: item.question,
      options: item.options.map(text => ({ text, imageUrl: '' })),
      correctAnswer: 0,
      active: true,
    }))
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Additional question bank import failed:', error)
  }
  const existingCount = await Question.countDocuments()
  await Question.updateMany(
    { options: { $type: 'array' } },
    [{ $set: { options: { $map: { input: '$options', as: 'option', in: {
      text: { $cond: [{ $eq: [{ $type: '$$option' }, 'string'] }, '$$option', '$$option.text'] },
      imageUrl: { $cond: [{ $eq: [{ $type: '$$option' }, 'string'] }, '', { $ifNull: ['$$option.imageUrl', ''] }] },
    } } } } }]
  )
  if (existingCount === 0) {
    const seed = importedQuestions.length ? importedQuestions : questionBank.map(item => ({
      ...item,
      options: item.options.map(option => typeof option === 'string' ? { text: option, imageUrl: '' } : option),
    }))
    await Question.insertMany(seed)
    console.log(`Seeded ${seed.length} Quizly questions`)
  } else if (importedQuestions.length && !(await Question.exists({ question: importedQuestions[0].question }))) {
    await Question.insertMany(importedQuestions)
    console.log(`Imported ${importedQuestions.length} additional Quizly questions`)
  }
  if (additionalQuestions.length) {
    const existingAdditional = await Question.find({ question: { $in: additionalQuestions.map(item => item.question) } }).select('question').lean()
    const existingTexts = new Set(existingAdditional.map(item => item.question))
    const missingAdditional = additionalQuestions.filter(item => !existingTexts.has(item.question))
    if (missingAdditional.length) {
      await Question.insertMany(missingAdditional)
      console.log(`Imported ${missingAdditional.length} new engagement questions`)
    }
  }
  return app.listen(port, () => console.log(`Quizly API listening on port ${port}`))
}

if (process.env.NODE_ENV !== 'test') start().catch(error => { console.error('MongoDB connection failed:', error); process.exit(1) })
export default app
