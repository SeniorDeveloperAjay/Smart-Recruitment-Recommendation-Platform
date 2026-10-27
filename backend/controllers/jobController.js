const Job = require('../models/Job')

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      requiredSkills,
      minimumExperience,
      location,
      employmentType
    } = req.body

    if (
      !title ||
      !description ||
      !department ||
      !requiredSkills ||
      minimumExperience === undefined ||
      !location ||
      !employmentType
    ) {
      return res.status(400).json({
        success: false,
        message: 'All job fields are required'
      })
    }

    const job = await Job.create({
      title,
      description,
      department,
      requiredSkills,
      minimumExperience,
      location,
      employmentType,
      createdBy: req.user.userId
    })

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Job creation failed',
      error: error.message
    })
  }
}

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      jobs
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    })
  }
}

module.exports = {
  createJob,
  getJobs
}