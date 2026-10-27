const Candidate = require('../models/Candidate')
const extractPdfText = require('../utils/extractPdfText')

const createCandidate = async (req, res) => {
  try {
   const {
  fullName,
  email,
  phone,
  education,
  experience,
  location,
  resumeText
} = req.body

let skills = req.body.skills

if (typeof skills === 'string') {
  try {
    skills = JSON.parse(skills)
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Skills must be a valid list.'
    })
  }
}

    if (
      !fullName ||
      !email ||
      !skills ||
      !education ||
      experience === undefined ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required candidate fields are missing'
      })
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one skill is required'
      })
    }

    // Use manually entered resume text by default.
    let extractedResumeText = resumeText || ''

    // Extract text when a PDF resume is uploaded.
    if (req.file) {
      extractedResumeText = await extractPdfText(req.file.buffer)

      if (!extractedResumeText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'No readable text was found in the uploaded PDF.'
        })
      }
    }

    // Create the candidate record.
    const candidate = await Candidate.create({
      user: req.user.userId,
      fullName,
      email,
      phone,
      skills,
      education,
      experience,
      location,
      resumeText: extractedResumeText
    })

    return res.status(201).json({
      success: true,
      message: req.file
        ? 'Candidate created successfully with PDF resume text extracted'
        : 'Candidate created successfully',
      candidate
    })
  } catch (error) {
    console.error('Candidate creation error:', error)

    return res.status(500).json({
      success: false,
      message:
        'Candidate creation failed. Please check the submitted data and resume file.'
    })
  }
}

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      candidates
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: error.message
    })
  }
}

const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('user', 'name email role')

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      })
    }

    res.json({
      success: true,
      candidate
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate',
      error: error.message
    })
  }
}

module.exports = {
  createCandidate,
  getCandidates,
  getCandidateById
}