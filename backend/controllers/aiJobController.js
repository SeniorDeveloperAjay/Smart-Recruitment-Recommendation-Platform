const {
  analyzeJobDescription
} = require('../services/ai/jobAnalyzerService')

const analyzeJob = async (req, res) => {
  try {
    const { jobDescription } = req.body

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      })
    }

    const analysis = await analyzeJobDescription(
      jobDescription
    )

    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error(
      'AI job analysis failed:',
      error.message
    )

    res.status(500).json({
      success: false,
      message: 'AI job analysis failed',
      error: error.message
    })
  }
}

module.exports = {
  analyzeJob
}