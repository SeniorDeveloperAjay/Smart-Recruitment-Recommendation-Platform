import { useEffect, useState } from 'react'
import AIJobAnalyzer from '../components/AIJobAnalyzer'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const [aiResults, setAiResults] = useState({})
  const [aiLoading, setAiLoading] = useState({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    requiredSkills: '',
    minimumExperience: '',
    location: '',
    employmentType: 'Full-Time'
  })

  const token = localStorage.getItem('token')

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/jobs', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setJobs(data.jobs)
      }
    } catch (error) {
      setMessage('Unable to load jobs')
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const response = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          requiredSkills: formData.requiredSkills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          minimumExperience: Number(formData.minimumExperience)
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Job created successfully!')

        setFormData({
          title: '',
          description: '',
          department: '',
          requiredSkills: '',
          minimumExperience: '',
          location: '',
          employmentType: 'Full-Time'
        })

        setShowForm(false)
        fetchJobs()
      } else {
        setMessage(data.message)
      }
    } catch (error) {
      setMessage('Unable to connect to backend')
    }
  }

  const handleAIMatching = async (jobId) => {
    setAiLoading((previous) => ({
      ...previous,
      [jobId]: true
    }))

    try {
      const response = await fetch(
        `http://localhost:5000/api/ai/match/${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setAiResults((previous) => ({
          ...previous,
          [jobId]: data
        }))
      } else {
        setMessage(data.message || 'AI matching failed')
      }
    } catch (error) {
      setMessage('Unable to connect to AI matching service')
    } finally {
      setAiLoading((previous) => ({
        ...previous,
        [jobId]: false
      }))
    }
  }

  return (
    <div className="container-fluid px-4 py-4">
      <AIJobAnalyzer />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">Job Management</h1>
          <p className="text-secondary mb-0">
            Create and manage recruitment opportunities
          </p>
        </div>

        <button
          className="btn btn-primary px-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Close Form' : '+ Create Job'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {/* Create Job Form */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-4">Create New Job</h4>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Job Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Software Developer"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    className="form-control"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Job Description
                  </label>

                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the role and responsibilities..."
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Required Skills
                  </label>

                  <input
                    type="text"
                    name="requiredSkills"
                    className="form-control"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    placeholder="React, Node.js, MongoDB"
                    required
                  />

                  <small className="text-secondary">
                    Separate skills using commas
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Minimum Experience
                  </label>

                  <input
                    type="number"
                    name="minimumExperience"
                    className="form-control"
                    min="0"
                    value={formData.minimumExperience}
                    onChange={handleChange}
                    placeholder="Years"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Noida"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Employment Type
                  </label>

                  <select
                    name="employmentType"
                    className="form-select"
                    value={formData.employmentType}
                    onChange={handleChange}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-success px-4"
                  >
                    Create Job
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">Available Jobs</h4>

              <p className="text-secondary mb-0">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-5">
              <h5>No jobs found</h5>

              <p className="text-secondary">
                Create your first job to get started.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {jobs.map((job) => {
                const aiResult = aiResults[job._id]
                const loading = aiLoading[job._id]

                return (
                  <div
                    className="col-md-6 col-xl-4"
                    key={job._id}
                  >
                    <div className="card h-100 border shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-3">
                          <span className="badge bg-success">
                            {job.status}
                          </span>

                          <span className="text-secondary small">
                            {job.employmentType}
                          </span>
                        </div>

                        <h5 className="fw-bold">
                          {job.title}
                        </h5>

                        <p className="text-secondary small mb-2">
                          {job.department} • {job.location}
                        </p>

                        <p className="text-secondary">
                          {job.description}
                        </p>

                        <div className="mb-3">
                          {job.requiredSkills?.map((skill) => (
                            <span
                              key={skill}
                              className="badge text-bg-light border me-1 mb-1"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <p className="small mb-0">
                          <strong>Experience:</strong>{' '}
                          {job.minimumExperience} year
                          {job.minimumExperience !== 1 ? 's' : ''}
                        </p>

                        {/* AI Matching Button */}
                        <button
                          className="btn btn-outline-primary w-100 mt-3"
                          onClick={() => handleAIMatching(job._id)}
                          disabled={loading}
                        >
                          {loading
                            ? 'Analyzing Candidates...'
                            : '🤖 AI Match Candidates'}
                        </button>

                        {/* AI Results */}
                        {aiResult && (
                          <div className="mt-4">
                            <div className="border-top pt-3">
                              <h6 className="fw-bold mb-3">
                                🤖 AI Candidate Matching
                              </h6>

                              <div className="small text-secondary mb-3">
                                <div>
                                  <strong>Algorithm:</strong>{' '}
                                  {aiResult.algorithm.name}
                                </div>

                                <div>
                                  <strong>Heuristic:</strong>{' '}
                                  {aiResult.algorithm.heuristic}
                                </div>

                                <div>
                                  <strong>Eligibility:</strong>{' '}
                                  {aiResult.algorithm.eligibilityFilter}
                                </div>
                              </div>

                              {aiResult.rankedCandidates.map(
                                (candidate, index) => {
                                  const breakdown =
                                    candidate.explanation?.breakdown
                                    const aiAnalysis = candidate.aiAnalysis

                                  return (
                                    <div
                                      key={candidate.candidateId}
                                      className="border rounded p-3 mb-3"
                                    >
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                          <strong>
                                            #{index + 1}{' '}
                                            {candidate.candidateName}
                                          </strong>
                                        </div>

                                        <span
                                          className={`badge ${
                                            candidate.eligibility.eligible
                                              ? 'bg-success'
                                              : 'bg-danger'
                                          }`}
                                        >
                                          {candidate.eligibility.eligible
                                            ? 'Eligible'
                                            : 'Not Eligible'}
                                        </span>
                                      </div>

                                      <div className="mb-2">
                                        <strong>Match Score:</strong>{' '}
                                        {candidate.score.totalScore}%
                                      </div>

                                      {candidate.matchedSkills.length > 0 && (
                                        <div className="mb-2">
                                          <strong>Matched Skills:</strong>

                                          <div className="mt-1">
                                            {candidate.matchedSkills.map(
                                              (skill) => (
                                                <span
                                                  key={skill}
                                                  className="badge bg-success-subtle text-success border me-1 mb-1"
                                                >
                                                  {skill}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {candidate.missingSkills.length > 0 && (
                                        <div className="mb-2">
                                          <strong>Missing Skills:</strong>

                                          <div className="mt-1">
                                            {candidate.missingSkills.map(
                                              (skill) => (
                                                <span
                                                  key={skill}
                                                  className="badge bg-danger-subtle text-danger border me-1 mb-1"
                                                >
                                                  {skill}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Structured Explanation Breakdown */}
                                      {breakdown && (
                                        <div className="bg-light rounded p-3 mb-3 small">
                                          <h6 className="fw-bold mb-3">
                                            Match Breakdown
                                          </h6>

                                          <div className="mb-3">
                                            <strong>Experience Check</strong>

                                            <div className="text-secondary mt-1">
                                              Candidate experience:{' '}
                                              {breakdown.experience.candidateYears}{' '}
                                              years
                                            </div>

                                            <div className="text-secondary">
                                              Minimum required:{' '}
                                              {breakdown.experience.minimumRequiredYears}{' '}
                                              years
                                            </div>

                                            <span
                                              className={`badge mt-2 ${
                                                breakdown.experience.requirementSatisfied
                                                  ? 'bg-success'
                                                  : 'bg-danger'
                                              }`}
                                            >
                                              {breakdown.experience.requirementSatisfied
                                                ? 'Experience Requirement Satisfied'
                                                : 'Experience Requirement Not Satisfied'}
                                            </span>
                                          </div>

                                          <div className="mb-3">
                                            <strong>Skills Check</strong>

                                            <div className="text-secondary mt-1">
                                              Required skills:{' '}
                                              {breakdown.skills.required.length}
                                            </div>

                                            <div className="text-secondary">
                                              Matched skills:{' '}
                                              {breakdown.skills.matched.length}
                                            </div>

                                            <div className="text-secondary">
                                              Missing skills:{' '}
                                              {breakdown.skills.missing.length}
                                            </div>
                                          </div>

                                          <div className="mb-3">
                                            <strong>Score Breakdown</strong>

                                            <div className="text-secondary mt-1">
                                              Skills score:{' '}
                                              {breakdown.score.skillsPercentage}%
                                            </div>

                                            <div className="text-secondary">
                                              Experience score:{' '}
                                              {breakdown.score.experiencePercentage}%
                                            </div>

                                            <div className="text-secondary">
                                              Total match score:{' '}
                                              {breakdown.score.totalPercentage}%
                                            </div>
                                          </div>

                                          <div>
                                            <strong>Eligibility Checks</strong>

                                            <div className="text-secondary mt-1">
                                              Skills requirement:{' '}
                                              {breakdown.eligibility.skillsSatisfied
                                                ? 'Satisfied'
                                                : 'Not satisfied'}
                                            </div>

                                            <div className="text-secondary">
                                              Experience requirement:{' '}
                                              {breakdown.eligibility.experienceSatisfied
                                                ? 'Satisfied'
                                                : 'Not satisfied'}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* AI Candidate Insights */}
                                      <div className="border rounded p-3 mb-3 bg-light">
                                        <h6 className="fw-bold mb-3">
                                          🤖 AI Candidate Insights
                                        </h6>

                                        {aiAnalysis?.status === 'completed' && aiAnalysis.analysis ? (
                                          <>
                                            <p className="small text-secondary">
                                              Information extracted from the candidate's resume. Please verify the extracted details.
                                            </p>

                                            <div className="mb-3">
                                              <strong>AI Summary</strong>
                                              <p className="small mb-0 mt-1">
                                                {aiAnalysis.analysis.summary || 'No summary available.'}
                                              </p>
                                            </div>

                                            <div className="mb-3">
                                              <strong>AI-Extracted Skills</strong>
                                              <div className="mt-2">
                                                {Array.isArray(aiAnalysis.analysis.skills) && aiAnalysis.analysis.skills.length > 0 ? (
                                                  aiAnalysis.analysis.skills.map((skill, skillIndex) => (
                                                    <span
                                                      key={String(skill) + '-' + skillIndex}
                                                      className="badge bg-primary-subtle text-primary border me-1 mb-1"
                                                    >
                                                      {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                                                    </span>
                                                  ))
                                                ) : (
                                                  <p className="small text-secondary mb-0">No skills extracted.</p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="mb-3">
                                              <strong>Experience</strong>
                                              <p className="small mb-0 mt-1">
                                                {aiAnalysis.analysis.experience !== null && aiAnalysis.analysis.experience !== undefined && Number.isFinite(Number(aiAnalysis.analysis.experience)) ? Number(aiAnalysis.analysis.experience) + ' years' : 'Not identified'}
                                              </p>
                                            </div>

                                            <div className="mb-3">
                                              <strong>Location</strong>
                                              <p className="small mb-0 mt-1">
                                                {aiAnalysis.analysis.location || 'Not identified'}
                                              </p>
                                            </div>

                                            {[
                                              { title: 'Education', items: aiAnalysis.analysis.education },
                                              { title: 'Certifications', items: aiAnalysis.analysis.certifications },
                                              { title: 'Projects', items: aiAnalysis.analysis.projects },
                                              { title: 'Other Information', items: aiAnalysis.analysis.otherInformation }
                                            ].map((section) => (
                                              <div className="mb-3" key={section.title}>
                                                <strong>{section.title}</strong>
                                                {Array.isArray(section.items) && section.items.length > 0 ? (
                                                  <ul className="small mt-1 mb-0 ps-3">
                                                    {section.items.map((item, itemIndex) => (
                                                      <li key={itemIndex}>
                                                        {typeof item === 'string' ? item : JSON.stringify(item)}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : (
                                                  <p className="small text-secondary mb-0 mt-1">No information extracted.</p>
                                                )}
                                              </div>
                                            ))}

                                            <div className="alert alert-info small mb-0">
                                              AI-extracted information is provided for review. It does not change the candidate's match score or eligibility.
                                            </div>
                                          </>
                                        ) : aiAnalysis?.status === 'failed' ? (
                                          <p className="small text-warning mb-0">
                                            AI resume analysis is temporarily unavailable. Please try matching candidates again later.
                                          </p>
                                        ) : aiAnalysis?.status === 'skipped' ? (
                                          <p className="small text-secondary mb-0">
                                            Resume analysis was skipped because resume text was unavailable.
                                          </p>
                                        ) : (
                                          <p className="small text-secondary mb-0">
                                            AI resume analysis is not available for this candidate.
                                          </p>
                                        )}
                                      </div>

                                      {/* Explanation Reasons */}
                                      <div className="small text-secondary">
                                        <p className="mb-2">
                                          <strong>Match Explanation:</strong>
                                        </p>

                                        <ul className="mb-0 ps-3">
                                          {candidate.explanation.reasons.map(
                                            (reason, reasonIndex) => (
                                              <li key={reasonIndex}>
                                                {reason}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Jobs