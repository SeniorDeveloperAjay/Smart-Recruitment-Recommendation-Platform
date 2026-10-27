const express = require('express')

const {
  matchCandidatesForJob
} = require('../controllers/aiController')

const authMiddleware = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')

const router = express.Router()

router.get(
  '/match/:jobId',
  authMiddleware,
  requireRole('recruiter'),
  matchCandidatesForJob
)

module.exports = router