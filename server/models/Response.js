import mongoose from 'mongoose'

const responseSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  playerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true, min: 0 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  completedAt: { type: Date, default: Date.now },
})

responseSchema.index({ quizId: 1, score: -1, completedAt: 1 })

export default mongoose.model('Response', responseSchema)
