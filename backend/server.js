
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const connectDB = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const jobRoutes = require('./routes/jobRoutes')
const candidateRoutes = require('./routes/candidateRoutes')
const applicationRoutes = require('./routes/applicationRoutes')
const aiRoutes = require('./routes/aiRoutes')
const aiJobRoutes = require('./routes/aiJobRoutes')
const aiCandidateRoutes = require('./routes/aiCandidateRoutes')
const resumeJobMatchingRoutes = require('./routes/resumeJobMatchingRoutes')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Authentication routes
app.use('/api/auth', authRoutes)

// Job and candidate routes
app.use('/api/jobs', jobRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/applications', applicationRoutes)

// AI routes
app.use('/api/ai', aiRoutes)
app.use('/api/ai', aiJobRoutes)
app.use('/api/ai', aiCandidateRoutes)

// Resume-to-job matching route
app.use('/api/resume-job-matching', resumeJobMatchingRoutes)

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Recruitment Recommendation Platform API is running!'
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is healthy'
  })
})

// Connect to MongoDB
connectDB()

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

