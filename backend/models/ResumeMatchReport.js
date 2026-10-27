
const mongoose = require('mongoose')

const resumeMatchReportSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true
    },

    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    summary: {
      type: String,
      required: true
    },

    matchingSkills: [
      {
        skill: {
          type: String,
          required: true
        },
        evidence: {
          type: String,
          default: ''
        }
      }
    ],

    missingSkills: [
      {
        type: String
      }
    ],

    experienceAssessment: {
      candidateYears: {
        type: Number,
        default: 0
      },
      requiredYears: {
        type: Number,
        default: 0
      },
      meetsRequirement: {
        type: Boolean,
        default: false
      },
      explanation: {
        type: String,
        default: ''
      }
    },

    strengths: [
      {
        type: String
      }
    ],

    areasToImprove: [
      {
        type: String
      }
    ],

    interviewQuestions: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model(
  'ResumeMatchReport',
  resumeMatchReportSchema
)

