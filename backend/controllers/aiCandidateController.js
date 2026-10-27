const {
  analyzeCandidateProfile
} = require('../services/ai/candidateAnalyzerService')

const analyzeCandidate = async (req, res) => {
  try {
    const { candidateText } = req.body

    if (!candidateText || !candidateText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Candidate profile or resume text is required'
      })
    }

    const analysis = await analyzeCandidateProfile(
      candidateText
    )

    res.json({
      success: true,
      analysis: JSON.parse(analysis)
    })
  } catch (error) {
    console.error(
      'AI candidate analysis failed:',
      error.message
    )

    res.status(500).json({
      success: false,
      message: 'AI candidate analysis failed',
      error: error.message
    })
  }
}

module.exports = {
  analyzeCandidate
}