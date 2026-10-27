const express = require('express')

const {
  analyzeCandidate
} = require('../controllers/aiCandidateController')

const authMiddleware = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')

const router = express.Router()

router.post(
  '/analyze-candidate',
  authMiddleware,
  requireRole('recruiter'),
  analyzeCandidate
)

module.exports = router