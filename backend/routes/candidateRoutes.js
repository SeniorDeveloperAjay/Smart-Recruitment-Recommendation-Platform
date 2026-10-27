const express = require('express')

const {
  createCandidate,
  getCandidates,
  getCandidateById
} = require('../controllers/candidateController')

const authMiddleware = require('../middleware/authMiddleware')
const resumeUpload = require('../middleware/resumeUpload')

const router = express.Router()

router.post(
  '/',
  authMiddleware,
  resumeUpload.single('resume'),
  createCandidate
)

router.get('/', authMiddleware, getCandidates)

router.get('/:id', authMiddleware, getCandidateById)

module.exports = router