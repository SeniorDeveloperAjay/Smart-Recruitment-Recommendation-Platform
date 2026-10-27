import { useState } from 'react'

function AIJobAnalyzer() {
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setMessage('Please enter a job description.')
      return
    }

    setLoading(true)
    setMessage('')
    setAnalysis(null)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        'http://localhost:5000/api/ai/analyze-job',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            jobDescription
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'AI analysis failed')
        return
      }

      const parsedAnalysis =
        typeof data.analysis === 'string'
          ? JSON.parse(data.analysis)
          : data.analysis

      setAnalysis(parsedAnalysis)
    } catch (error) {
      setMessage('Unable to connect to AI service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h4 className="mb-3">
          AI Job Requirement Analyzer
        </h4>

        <p className="text-secondary">
          Enter a job description and let AI extract
          structured recruitment requirements.
        </p>

        <textarea
          className="form-control mb-3"
          rows="6"
          value={jobDescription}
          onChange={(event) =>
            setJobDescription(event.target.value)
          }
          placeholder="Enter the job description..."
        />

        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading
            ? 'Analyzing...'
            : 'Analyze with AI'}
        </button>

        {message && (
          <div className="alert alert-warning mt-3">
            {message}
          </div>
        )}

        {analysis && (
          <div className="mt-4">
            <h5>AI Analysis</h5>

            <p>
              <strong>Skills:</strong>{' '}
              {analysis.skills?.join(', ') || 'None'}
            </p>

            <p>
              <strong>Minimum Experience:</strong>{' '}
              {analysis.minimumExperience} years
            </p>

            <p>
              <strong>Education:</strong>{' '}
              {analysis.education?.join(', ') || 'None'}
            </p>

            <p>
              <strong>Responsibilities:</strong>
            </p>

            <ul>
              {analysis.responsibilities?.map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>

            <p>
              <strong>Other Requirements:</strong>
            </p>

            <ul>
              {analysis.otherRequirements?.map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIJobAnalyzer