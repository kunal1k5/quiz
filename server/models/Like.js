import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  clientId: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

likeSchema.index({ quizId: 1, clientId: 1 }, { unique: true })

export default mongoose.model('Like', likeSchema)
