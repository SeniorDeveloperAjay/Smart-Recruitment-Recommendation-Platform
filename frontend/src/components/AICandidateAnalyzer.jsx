import { useState } from 'react'

function AICandidateAnalyzer() {
  const [candidateText, setCandidateText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAnalyze = async () => {
    if (!candidateText.trim()) {
      setMessage('Please enter candidate profile or resume text.')
      return
    }

    setLoading(true)
    setMessage('')
    setAnalysis(null)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        'http://localhost:5000/api/ai/analyze-candidate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            candidateText
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Candidate analysis failed')
        return
      }

      setAnalysis(data.analysis)
    } catch (error) {
      setMessage('Unable to connect to the AI service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body p-4">
        <h4 className="mb-3">
          AI Candidate Analyzer
        </h4>

        <p className="text-secondary">
          Enter candidate profile or resume text to extract
          structured information using AI.
        </p>

        <textarea
          className="form-control mb-3"
          rows="6"
          value={candidateText}
          onChange={(event) => setCandidateText(event.target.value)}
          placeholder="Paste candidate profile or resume text here..."
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Candidate'}
        </button>

        {message && (
          <div className="alert alert-warning mt-3 mb-0">
            {message}
          </div>
        )}

        {analysis && (
          <div className="mt-4">
            <h5 className="mb-3">Analysis Results</h5>

            <p>
              <strong>Skills:</strong>{' '}
              {analysis.skills?.join(', ') || 'None specified'}
            </p>

            <p>
              <strong>Experience:</strong>{' '}
              {analysis.experience} years
            </p>

            <p>
              <strong>Education:</strong>{' '}
              {analysis.education?.join(', ') || 'None specified'}
            </p>

            <p>
              <strong>Certifications:</strong>{' '}
              {analysis.certifications?.join(', ') || 'None specified'}
            </p>

            <p>
              <strong>Projects:</strong>{' '}
              {analysis.projects?.join(', ') || 'None specified'}
            </p>

            <p>
              <strong>Location:</strong>{' '}
              {analysis.location || 'Not specified'}
            </p>

            <p>
              <strong>Summary:</strong>{' '}
              {analysis.summary || 'No summary available'}
            </p>

            <p className="mb-0">
              <strong>Other Information:</strong>{' '}
              {analysis.otherInformation?.join(', ') || 'None specified'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AICandidateAnalyzer