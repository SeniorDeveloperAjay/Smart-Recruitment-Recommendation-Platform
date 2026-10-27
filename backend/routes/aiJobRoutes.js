const express = require('express')

const {
analyzeJob
} = require('../controllers/aiJobController')

const {
matchCandidatesForJob,
getRecruitmentRecommendations,
runRecruitmentAgentController
} = require('../controllers/aiController')

const {
matchResumeToJobController
} = require('../controllers/resumeJobMatchingController')

const authMiddleware = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')

const router = express.Router()

// Analyze job requirements.
router.post(
'/analyze-job',
authMiddleware,
requireRole('recruiter'),
analyzeJob
)

// Match and rank candidates for a job.
router.post(
'/:jobId/match',
authMiddleware,
requireRole('recruiter'),
matchCandidatesForJob
)

// Generate AI recruitment recommendations for a job.
router.post(
'/:jobId/recommendations',
authMiddleware,
requireRole('recruiter'),
getRecruitmentRecommendations
)

// Run the AI Recruitment Automation Agent.
router.post(
'/:jobId/agent',
authMiddleware,
requireRole('recruiter'),
runRecruitmentAgentController
)

// Compare a candidate's resume with a selected job.
router.post(
'/resume-match',
authMiddleware,
requireRole('recruiter'),
matchResumeToJobController
)

module.exports = router
