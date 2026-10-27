const express = require('express')

const {
  createApplication,
  getApplications,
  updateApplicationStatus,
  shortlistApplications
} = require('../controllers/applicationController')

const authMiddleware = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleMiddleware')

const router = express.Router()

// Create an application.
router.post(
  '/',
  authMiddleware,
  requireRole('recruiter'),
  createApplication
)

// Get all applications.
router.get(
  '/',
  authMiddleware,
  requireRole('recruiter'),
  getApplications
)

// Shortlist selected applications after recruiter approval.
router.patch(
  '/shortlist',
  authMiddleware,
  requireRole('recruiter'),
  shortlistApplications
)

// Update the status of an individual application.
router.patch(
  '/:id/status',
  authMiddleware,
  requireRole('recruiter'),
  updateApplicationStatus
)

module.exports = router