
const mongoose = require('mongoose')

const Job = require('../models/Job')
const Candidate = require('../models/Candidate')
const ResumeMatchReport = require('../models/ResumeMatchReport')

const {
  matchResumeToJob
} = require('../services/ai/resumeJobMatchingService')

// Generate and save a resume-to-job matching report
async function matchResumeToJobController(req, res) {
  try {
    const { jobId, candidateId } = req.body

    // Validate required IDs
    if (!jobId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Both job ID and candidate ID are required.'
      })
    }

    // Validate MongoDB IDs
    if (
      !mongoose.isValidObjectId(jobId) ||
      !mongoose.isValidObjectId(candidateId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID or candidate ID.'
      })
    }

    // Find the job and candidate
    const job = await Job.findById(jobId)
    const candidate = await Candidate.findById(candidateId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      })
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found.'
      })
    }

    // Generate the AI matching report
    const report = await matchResumeToJob(job, candidate)

    // Save the report to MongoDB
    const savedReport = await ResumeMatchReport.create({
      job: job._id,
      candidate: candidate._id,
      matchScore: report.matchScore,
      summary: report.summary,
      matchingSkills: report.matchingSkills,
      missingSkills: report.missingSkills,
      experienceAssessment: report.experienceAssessment,
      strengths: report.strengths,
      areasToImprove: report.areasToImprove,
      interviewQuestions: report.interviewQuestions
    })

    // Return the generated report
    return res.status(200).json({
      success: true,
      message:
        'Resume-to-job matching completed and report saved successfully.',
      reportId: savedReport._id,
      job: {
        id: job._id,
        title: job.title,
        department: job.department
      },
      candidate: {
        id: candidate._id,
        name: candidate.fullName
      },
      report
    })
  } catch (error) {
    console.error(
      'Resume-to-job matching failed:',
      error.stack || error.message
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to complete resume-to-job matching.',
      error: error.message
    })
  }
}

// Retrieve saved resume matching reports
async function getResumeMatchHistoryController(req, res) {
  try {
    const reports = await ResumeMatchReport.find()
      .populate('job', 'title department')
      .populate('candidate', 'fullName email')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports
    })
  } catch (error) {
    console.error(
      'Fetching resume matching history failed:',
      error.stack || error.message
    )

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch resume matching history.'
    })
  }
}

module.exports = {
  matchResumeToJobController,
  getResumeMatchHistoryController
}

