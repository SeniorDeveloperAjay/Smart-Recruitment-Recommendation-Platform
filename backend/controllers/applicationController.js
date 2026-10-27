const Application = require('../models/Application')
const Job = require('../models/Job')
const Candidate = require('../models/Candidate')

const createApplication = async (req, res) => {
  try {
    const { jobId, candidateId, recruiterNotes } = req.body

    if (!jobId || !candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Job and candidate are required'
      })
    }

    const job = await Job.findById(jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      })
    }

    const candidate = await Candidate.findById(candidateId)

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      })
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: candidateId
    })

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'This candidate has already been added to this job'
      })
    }

    const application = await Application.create({
      job: jobId,
      candidate: candidateId,
      createdBy: req.user.userId,
      recruiterNotes
    })

    const populatedApplication = await Application.findById(
      application._id
    )
      .populate('job', 'title department location employmentType')
      .populate(
        'candidate',
        'fullName email skills education experience location'
      )
      .populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      application: populatedApplication
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This candidate has already been added to this job'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Application creation failed',
      error: error.message
    })
  }
}

const getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate(
        'job',
        'title department location employmentType status'
      )
      .populate(
        'candidate',
        'fullName email skills education experience location status'
      )
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      applications
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    })
  }
}

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body

    const allowedStatuses = [
      'Applied',
      'Shortlisted',
      'Interview',
      'Rejected',
      'Hired'
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status'
      })
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate(
        'job',
        'title department location employmentType'
      )
      .populate(
        'candidate',
        'fullName email skills education experience location'
      )

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      })
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    })
  }
}
// Shortlist selected applications after recruiter approval.
const shortlistApplications = async (req, res) => {
  try {
    const { jobId, applicationIds } = req.body

    if (
      !jobId ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Job and at least one application are required'
      })
    }

    if (
      applicationIds.some(
        (id) =>
          typeof id !== 'string' ||
          !/^[a-f\d]{24}$/i.test(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'One or more application IDs are invalid'
      })
    }

    const uniqueApplicationIds = [...new Set(applicationIds)]

    const applications = await Application.find({
      _id: { $in: uniqueApplicationIds },
      job: jobId
    })

    if (applications.length !== uniqueApplicationIds.length) {
      return res.status(400).json({
        success: false,
        message:
          'Some selected applications do not belong to this job'
      })
    }

    const invalidApplications = applications.filter(
      (application) => application.status !== 'Applied'
    )

    if (invalidApplications.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'Only applications with Applied status can be shortlisted',
        invalidApplicationIds: invalidApplications.map(
          (application) => String(application._id)
        )
      })
    }

    const result = await Application.updateMany(
      {
        _id: { $in: uniqueApplicationIds },
        job: jobId,
        status: 'Applied'
      },
      {
        $set: {
          status: 'Shortlisted'
        }
      },
      {
        runValidators: true
      }
    )

    if (result.modifiedCount !== uniqueApplicationIds.length) {
      return res.status(409).json({
        success: false,
        message:
          'Not all applications were updated. Refresh and try again.'
      })
    }

    return res.json({
      success: true,
      message: `${result.modifiedCount} application(s) shortlisted successfully`,
      shortlistedCount: result.modifiedCount
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to shortlist applications',
      error: error.message
    })
  }
}

module.exports = {
  createApplication,
  getApplications,
  updateApplicationStatus,
  shortlistApplications
}