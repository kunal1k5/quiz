import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true, index: true },
  relationshipType: { type: String, required: true, index: true },
  question: { type: String, required: true, trim: true },
  options: {
    type: [{
      text: { type: String, required: true, trim: true },
      imageUrl: { type: String, default: '' },
    }],
    required: true,
    validate: value => value.length === 4,
  },
  correctAnswer: { type: Number, default: null, min: 0, max: 3, select: false },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } })

questionSchema.index({ relationshipType: 1, category: 1, active: 1 })

export default mongoose.model('Question', questionSchema)
