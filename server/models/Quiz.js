import mongoose from 'mongoose'

const quizSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  manageToken: { type: String, required: true },
  creatorName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female', 'prefer_not_to_say'], default: null },
  relationshipType: { type: String, required: true, trim: true },
  questionIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Question', required: true, validate: value => value.length <= 15 },
  questionConfigs: {
    type: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    }],
    default: [],
  },
  customQuestions: {
    type: [{
      question: { type: String, required: true, trim: true },
      options: {
        type: [{
          text: { type: String, required: true, trim: true },
          imageUrl: { type: String, default: '' },
        }],
        required: true,
        validate: value => value.length === 4,
      },
      clientId: { type: String, trim: true },
      correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    }],
    default: [],
  },
  questionOrder: {
    type: [{
      type: { type: String, enum: ['normal', 'custom'], required: true },
      questionId: { type: String, required: true, trim: true },
    }],
    default: [],
  },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

quizSchema.index({ slug: 1, isActive: 1 })
quizSchema.index({ manageToken: 1 }, { unique: true, sparse: true })

export default mongoose.model('Quiz', quizSchema)
