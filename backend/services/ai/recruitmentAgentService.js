const Application = require('../../models/Application')

const {
  rankCandidatesWithBestFirstSearch
} = require('./bestFirstSearchService')

const {
  generateRecruitmentRecommendations
} = require('./recruitmentRecommendationService')

// Run the recruitment automation workflow.
const runRecruitmentAgent = async ({ job, candidates }) => {
  // Step 1: Retrieve existing applications for this job.
  const applications = await Application.find({
    job: job._id
  }).select('_id candidate status')

  // Step 2: Build a lookup map for faster application matching.
  const applicationMap = new Map()

  applications.forEach((application) => {
    applicationMap.set(
      String(application.candidate),
      application
    )
  })

  // Step 3: Rank candidates using Best-First Search.
  const rankedCandidates =
    await rankCandidatesWithBestFirstSearch(job, candidates)

  // Step 4: Attach application details to each candidate.
  const rankedCandidatesWithApplications =
    rankedCandidates.map((candidate) => {
      const candidateId = String(
        candidate.candidateId || candidate._id || ''
      )

      const application = applicationMap.get(candidateId)

      return {
        ...candidate,

        applicationId: application
          ? String(application._id)
          : null,

        applicationStatus: application
          ? application.status
          : 'Not Applied'
      }
    })

  // Step 5: Identify eligible candidates.
  const eligibleCandidates =
    rankedCandidatesWithApplications.filter(
      (candidate) =>
        candidate.eligibility?.eligible === true
    )

  // Step 6: Identify candidates eligible for shortlist selection.
  const shortlistCandidates =
    eligibleCandidates.filter(
      (candidate) =>
        candidate.applicationId &&
        candidate.applicationStatus === 'Applied'
    )

  // Step 7: Prepare eligible candidates for AI recommendations.
  const recommendationCandidates = eligibleCandidates.map(
    (candidate) => ({
      id: String(candidate.candidateId || candidate._id || ''),

      name: candidate.candidateName || 'Unknown candidate',

      eligible: true,

      applicationId: candidate.applicationId,

      applicationStatus: candidate.applicationStatus,

      canBeShortlisted:
        Boolean(candidate.applicationId) &&
        candidate.applicationStatus === 'Applied',

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

  // Step 8: Generate AI recruitment recommendations.
  const recommendations =
    await generateRecruitmentRecommendations({
      job,
      candidates: recommendationCandidates
    })

  // Step 9: Return results for recruiter review.
  return {
    workflow: {
      name: 'AI Recruitment Automation Agent',
      status: 'completed',
      stepsCompleted: 8
    },

    job: {
      id: String(job._id),
      title: job.title
    },

    summary: {
      totalCandidatesAnalyzed: rankedCandidates.length,

      eligibleCandidates: eligibleCandidates.length,

      candidatesWithApplications:
        rankedCandidatesWithApplications.filter(
          (candidate) => candidate.applicationId
        ).length,

      proposedShortlist: shortlistCandidates.length
    },

    rankedCandidates: rankedCandidatesWithApplications,

    recommendations
  }
}

module.exports = {
  runRecruitmentAgent
}