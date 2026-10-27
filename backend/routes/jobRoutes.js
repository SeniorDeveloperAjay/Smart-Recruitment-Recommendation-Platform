const express = require('express')
const {
  createJob,
  getJobs
} = require('../controllers/jobController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// Create a job
router.post('/', authMiddleware, createJob)

// Get all jobs
router.get('/', authMiddleware, getJobs)

module.exports = router