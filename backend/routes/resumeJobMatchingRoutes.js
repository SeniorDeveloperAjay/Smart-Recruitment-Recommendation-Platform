
const express = require('express')

const authMiddleware = require('../middleware/authMiddleware')

const {
  matchResumeToJobController,
  getResumeMatchHistoryController
} = require('../controllers/resumeJobMatchingController')

const router = express.Router()

// Match a candidate's resume against a job
router.post('/', authMiddleware, matchResumeToJobController)

// Retrieve saved resume matching history
router.get('/history', authMiddleware, getResumeMatchHistoryController)

module.exports = router

