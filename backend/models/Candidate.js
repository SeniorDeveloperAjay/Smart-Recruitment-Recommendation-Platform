const mongoose = require('mongoose')

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    skills: {
      type: [String],
      required: true
    },

    education: {
      type: String,
      required: true,
      trim: true
    },

    experience: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    resumeText: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ['Available', 'Hired', 'Not Available'],
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Candidate', candidateSchema)