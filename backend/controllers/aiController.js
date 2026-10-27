const Job = require('../models/Job')
const Candidate = require('../models/Candidate')

const {
  rankCandidatesWithBestFirstSearch
} = require('../services/ai/bestFirstSearchService')

const {
  generateRecruitmentRecommendations
} = require('../services/ai/recruitmentRecommendationService')

const {
  runRecruitmentAgent
} = require('../services/ai/recruitmentAgentService')

// Match and rank candidates for a specific job.
const matchCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await Job.findById(jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    const candidates = await Candidate.find({
      status: 'Available'
    })

    const rankedCandidates =
      await rankCandidatesWithBestFirstSearch(
        job,
        candidates
      )

    return res.json({
      success: true,

      job: {
        id: job._id,
        title: job.title,
        requiredSkills: job.requiredSkills,
        minimumExperience: job.minimumExperience
      },

      algorithm: {
        name: 'Best-First Search',
        heuristic: 'Candidate Match Score',
        eligibilityFilter:
          'Constraint Satisfaction Problem'
      },

      totalCandidates: candidates.length,
      rankedCandidates
    })
  } catch (error) {
    console.error(
      'Candidate matching failed:',
      error.message
    )

    return res.status(500).json({
      success: false,
      message: 'Candidate matching failed',
      error: error.message
    })
  }
}

// Generate AI-powered recruitment recommendations.
const getRecruitmentRecommendations = async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await Job.findById(jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    const candidates = await Candidate.find({
      status: 'Available'
    })

    // Reuse the existing candidate-ranking algorithm.
    const rankedCandidates =
      await rankCandidatesWithBestFirstSearch(
        job,
        candidates
      )

    // Prepare candidate information for AI recommendations.
    const recommendationCandidates = rankedCandidates.map(
      (candidate) => ({
        id: String(candidate.candidateId || ''),

        name: candidate.candidateName || 'Unknown candidate',

        eligible:
          candidate.eligibility?.eligible === true,

        matchScore:
          Number(candidate.score?.totalScore) || 0,

        matchedSkills: Array.isArray(candidate.matchedSkills)
          ? candidate.matchedSkills
          : [],

        missingSkills: Array.isArray(candidate.missingSkills)
          ? candidate.missingSkills
          : [],

        experience:
          candidate.explanation?.breakdown?.experience
            ?.candidateYears ?? 0,

        resumeSummary:
          candidate.aiAnalysis?.analysis?.summary || ''
      })
    )

    // Generate recommendations without changing
    // existing candidate scores or eligibility.
    const recommendations =
      await generateRecruitmentRecommendations({
        job,
        candidates: recommendationCandidates
      })

    return res.json({
      success: true,

      job: {
        id: job._id,
        title: job.title
      },

      recommendations
    })
  } catch (error) {
    console.error(
      'Recruitment recommendations failed:',
      error.message
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to generate recruitment recommendations',
      error: error.message
    })
  }
}

// Run the AI recruitment automation agent.
const runRecruitmentAgentController = async (req, res) => {
  try {
    const { jobId } = req.params

    // Step 1: Find the selected job.
    const job = await Job.findById(jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    // Step 2: Retrieve available candidates.
    const candidates = await Candidate.find({
      status: 'Available'
    })

    // Step 3: Run the recruitment automation workflow.
    const result = await runRecruitmentAgent({
      job,
      candidates
    })

    return res.json({
      success: true,
      ...result
    })
  } catch (error) {
    // Log the full error in the backend terminal for debugging.
    console.error(
      'Recruitment automation agent failed:',
      error
    )

    // Temporarily return the actual error to identify the cause.
    return res.status(500).json({
      success: false,
      message: 'Recruitment automation agent failed',
      error: error.message
    })
  }
}

module.exports = {
  matchCandidatesForJob,
  getRecruitmentRecommendations,
  runRecruitmentAgentController
}