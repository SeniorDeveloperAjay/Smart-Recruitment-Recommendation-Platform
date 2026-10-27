const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    requiredSkills: {
      type: [String],
      required: true
    },

    minimumExperience: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract'],
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Job', jobSchema)