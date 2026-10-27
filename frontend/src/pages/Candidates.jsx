import { useEffect, useState } from 'react'
import AICandidateAnalyzer from '../components/AICandidateAnalyzer'

const API_URL = 'http://localhost:5000/api'

function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [analyzingCandidateId, setAnalyzingCandidateId] = useState(null)
  const [candidateAnalyses, setCandidateAnalyses] = useState({})
  const [resumeFile, setResumeFile] = useState(null)

  // Resume-to-job matching
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [matchingResume, setMatchingResume] = useState(false)
  const [matchingReport, setMatchingReport] = useState(null)
  const [matchingError, setMatchingError] = useState('')

  // Matching history
  const [matchingHistory, setMatchingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedHistoryReport, setSelectedHistoryReport] = useState(null)

  // Candidate comparison
  const [comparisonJobId, setComparisonJobId] = useState('')
  const [selectedComparisonIds, setSelectedComparisonIds] = useState([])
  const [showComparison, setShowComparison] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    education: '',
    experience: '',
    location: '',
    resumeText: ''
  })

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`${API_URL}/candidates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || 'Unable to load candidates.')
        return
      }

      setCandidates(data.candidates || [])
    } catch {
      setMessage('Unable to load candidates.')
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMatchingError(data.message || 'Unable to load jobs.')
        return
      }

      setJobs(data.jobs || [])
    } catch {
      setMatchingError('Unable to connect to the backend while loading jobs.')
    }
  }

  // Retrieve saved reports from MongoDB
  const fetchMatchingHistory = async () => {
    setLoadingHistory(true)
    setHistoryError('')

    try {
      const response = await fetch(
        `${API_URL}/resume-job-matching/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        setHistoryError(data.message || 'Unable to load matching history.')
        return
      }

      setMatchingHistory(data.reports || [])
    } catch {
      setHistoryError('Unable to connect to the backend.')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
    fetchJobs()
    fetchMatchingHistory()
  }, [])

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    })
  }

  const handleAnalyzeCandidate = async (candidate) => {
    const candidateText = [
      candidate.fullName ? `Name: ${candidate.fullName}` : '',
      candidate.skills?.length
        ? `Skills: ${candidate.skills.join(', ')}`
        : '',
      candidate.education ? `Education: ${candidate.education}` : '',
      Number.isFinite(Number(candidate.experience))
        ? `Experience: ${candidate.experience} years`
        : '',
      candidate.location ? `Location: ${candidate.location}` : '',
      candidate.resumeText
        ? `Resume/Profile: ${candidate.resumeText}`
        : ''
    ]
      .filter(Boolean)
      .join('\n')

    if (!candidateText.trim()) {
      setMessage(
        `No profile information is available to analyze for ${candidate.fullName}.`
      )
      return
    }

    setAnalyzingCandidateId(candidate._id)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/ai/analyze-candidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ candidateText })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(
          data.message || `AI analysis failed for ${candidate.fullName}.`
        )
        return
      }

      const analysis =
        typeof data.analysis === 'string'
          ? JSON.parse(data.analysis)
          : data.analysis

      if (
        !analysis ||
        typeof analysis !== 'object' ||
        !Array.isArray(analysis.skills)
      ) {
        throw new Error(
          'The AI returned an unexpected analysis format. Please try again.'
        )
      }

      setCandidateAnalyses((previous) => ({
        ...previous,
        [candidate._id]: analysis
      }))
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the AI service.')
    } finally {
      setAnalyzingCandidateId(null)
    }
  }

  const handleResumeJobMatch = async (event) => {
    event.preventDefault()
    setMatchingError('')
    setMatchingReport(null)

    if (!selectedJobId || !selectedCandidateId) {
      setMatchingError('Please select both a job and a candidate.')
      return
    }

    setMatchingResume(true)

    try {
      const response = await fetch(`${API_URL}/resume-job-matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          candidateId: selectedCandidateId
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMatchingError(
          data.message || 'Unable to match the resume to the selected job.'
        )
        return
      }

      setMatchingReport(data.report)

      // Refresh saved history after a successful match
      await fetchMatchingHistory()
    } catch {
      setMatchingError(
        'Unable to connect to the backend. Check that the server is running.'
      )
    } finally {
      setMatchingResume(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const submissionData = new FormData()

      submissionData.append('fullName', formData.fullName)
      submissionData.append('email', formData.email)
      submissionData.append('phone', formData.phone)
      submissionData.append('education', formData.education)
      submissionData.append('experience', formData.experience)
      submissionData.append('location', formData.location)
      submissionData.append('resumeText', formData.resumeText)

      const skillsArray = formData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)

      submissionData.append('skills', JSON.stringify(skillsArray))

      if (resumeFile) {
        submissionData.append('resume', resumeFile)
      }

      const response = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: submissionData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage(data.message || 'Candidate added successfully!')

        setFormData({
          fullName: '',
          email: '',
          phone: '',
          skills: '',
          education: '',
          experience: '',
          location: '',
          resumeText: ''
        })

        setResumeFile(null)
        setShowForm(false)
        await fetchCandidates()
      } else {
        setMessage(data.message || 'Candidate creation failed.')
      }
    } catch {
      setMessage('Unable to connect to backend.')
    }
  }

  const selectedJob = jobs.find((job) => job._id === selectedJobId)

  const selectedCandidate = candidates.find(
    (candidate) => candidate._id === selectedCandidateId
  )

  // Get the latest saved report for each candidate for the selected job.
  const comparisonReports = (() => {
    const latestReportsByCandidate = new Map()

    matchingHistory
      .filter((report) => {
        return (
          comparisonJobId &&
          report.job?._id === comparisonJobId &&
          report.candidate?._id
        )
      })
      .forEach((report) => {
        const candidateId = report.candidate._id
        const existingReport = latestReportsByCandidate.get(candidateId)

        const reportTime = new Date(report.createdAt || 0).getTime()
        const existingTime = existingReport
          ? new Date(existingReport.createdAt || 0).getTime()
          : -1

        if (!existingReport || reportTime >= existingTime) {
          latestReportsByCandidate.set(candidateId, report)
        }
      })

    return Array.from(latestReportsByCandidate.values()).sort((a, b) => {
      return (b.matchScore ?? -1) - (a.matchScore ?? -1)
    })
  })()

  // Reports belonging to candidates selected for comparison.
  const selectedComparisonReports = comparisonReports.filter((report) =>
    selectedComparisonIds.includes(report.candidate?._id)
  )

  const handleComparisonJobChange = (event) => {
    setComparisonJobId(event.target.value)
    setSelectedComparisonIds([])
    setShowComparison(false)
  }

  const handleComparisonSelection = (candidateId, checked) => {
    setSelectedComparisonIds((previous) => {
      if (checked) {
        if (previous.includes(candidateId)) {
          return previous
        }

        return [...previous, candidateId]
      }

      return previous.filter((id) => id !== candidateId)
    })

    setShowComparison(false)
  }

  const handleCompareCandidates = () => {
    if (selectedComparisonReports.length < 2) {
      setHistoryError('')
      setMessage('Please select at least two candidates to compare.')
      return
    }

    setMessage('')
    setShowComparison(true)
  }

  const formatList = (items, emptyMessage = 'None listed') => {
    if (!Array.isArray(items) || items.length === 0) {
      return <span className="text-secondary">{emptyMessage}</span>
    }

    return (
      <ul className="mb-0 ps-3">
        {items.map((item, index) => (
          <li key={index} className="mb-1">
            {typeof item === 'string' ? item : item?.skill || 'Not specified'}
          </li>
        ))}
      </ul>
    )
  }

  // Display a matching report, including previously saved reports.
  const renderMatchingReport = (report) => {
    if (!report) return null

    const experience = report.experienceAssessment

    return (
      <div className="mt-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-2">AI Matching Report</h5>

          <div className="text-center rounded border p-3">
            <div className="display-6 fw-bold text-primary">
              {report.matchScore ?? '—'}%
            </div>
            <div className="small text-secondary">Match Score</div>
          </div>
        </div>

        {report.summary && (
          <div className="alert alert-primary">
            <strong>Summary:</strong> {report.summary}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="border rounded p-3 h-100">
              <h6 className="fw-bold text-success">Matching Skills</h6>

              {report.matchingSkills?.length ? (
                <ul className="mb-0 ps-3">
                  {report.matchingSkills.map((item, index) => (
                    <li key={`${item.skill}-${index}`} className="mb-2">
                      <strong>{item.skill}</strong>
                      {item.evidence && (
                        <div className="small text-secondary">
                          {item.evidence}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small text-secondary mb-0">
                  No matching skills identified.
                </p>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="border rounded p-3 h-100">
              <h6 className="fw-bold text-danger">Missing Skills</h6>

              {report.missingSkills?.length ? (
                <ul className="mb-0 ps-3">
                  {report.missingSkills.map((skill, index) => (
                    <li key={`${skill}-${index}`}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="small text-secondary mb-0">
                  No missing skills identified.
                </p>
              )}
            </div>
          </div>
        </div>

        {experience && (
          <div className="border rounded p-3 mb-3">
            <h6 className="fw-bold">Experience Assessment</h6>

            <p className="mb-1">
              <strong>Candidate experience:</strong>{' '}
              {experience.candidateYears ?? '—'} years
            </p>

            <p className="mb-1">
              <strong>Required experience:</strong>{' '}
              {experience.requiredYears ?? '—'} years
            </p>

            <p className="mb-1">
              <strong>Meets requirement:</strong>{' '}
              <span
                className={
                  experience.meetsRequirement
                    ? 'badge bg-success'
                    : 'badge bg-warning text-dark'
                }
              >
                {experience.meetsRequirement ? 'Yes' : 'No'}
              </span>
            </p>

            {experience.explanation && (
              <p className="small text-secondary mb-0 mt-2">
                {experience.explanation}
              </p>
            )}
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="border rounded p-3 h-100">
              <h6 className="fw-bold text-success">Strengths</h6>

              {report.strengths?.length ? (
                <ul className="mb-0 ps-3">
                  {report.strengths.map((item, index) => (
                    <li key={index} className="mb-1">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small text-secondary mb-0">
                  No strengths listed.
                </p>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <div className="border rounded p-3 h-100">
              <h6 className="fw-bold text-warning">Areas to Improve</h6>

              {report.areasToImprove?.length ? (
                <ul className="mb-0 ps-3">
                  {report.areasToImprove.map((item, index) => (
                    <li key={index} className="mb-1">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small text-secondary mb-0">
                  No improvement areas listed.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded p-3">
          <h6 className="fw-bold">Suggested Interview Questions</h6>

          {report.interviewQuestions?.length ? (
            <ol className="mb-0 ps-3">
              {report.interviewQuestions.map((question, index) => (
                <li key={index} className="mb-2">
                  {typeof question === 'string'
                    ? question
                    : question.question}

                  {typeof question === 'object' && question.skillAssessed && (
                    <div className="small text-secondary">
                      <strong>Skill assessed:</strong>{' '}
                      {question.skillAssessed}
                    </div>
                  )}

                  {typeof question === 'object' && question.purpose && (
                    <div className="small text-secondary">
                      <strong>Purpose:</strong> {question.purpose}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="small text-secondary mb-0">
              No interview questions generated.
            </p>
          )}
        </div>

        <div className="alert alert-warning small mt-3 mb-0">
          AI-generated scores and assessments may be inaccurate. Verify resume
          claims and evaluate candidates using consistent job-related criteria.
          This report does not make a hiring decision.
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-4 py-4">
      <AICandidateAnalyzer />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">Candidate Management</h1>
          <p className="text-secondary mb-0">
            Manage candidate profiles and recruitment data
          </p>
        </div>

        <button
          className="btn btn-primary px-4"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Close Form' : '+ Add Candidate'}
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {/* Resume-to-Job AI Matching */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h4 className="fw-bold mb-1">AI Resume-to-Job Matching</h4>

          <p className="text-secondary mb-4">
            Compare a candidate's resume with a job's requirements to evaluate
            skills, experience, strengths, and areas to improve.
          </p>

          {matchingError && (
            <div className="alert alert-danger">{matchingError}</div>
          )}

          <form onSubmit={handleResumeJobMatch}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Select Job</label>

                <select
                  className="form-select"
                  value={selectedJobId}
                  onChange={(event) => {
                    setSelectedJobId(event.target.value)
                    setMatchingReport(null)
                    setMatchingError('')
                  }}
                  required
                >
                  <option value="">Choose a job</option>

                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} — {job.department}
                    </option>
                  ))}
                </select>

                {jobs.length === 0 && (
                  <small className="text-secondary">
                    No jobs available. Create a job first.
                  </small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Select Candidate
                </label>

                <select
                  className="form-select"
                  value={selectedCandidateId}
                  onChange={(event) => {
                    setSelectedCandidateId(event.target.value)
                    setMatchingReport(null)
                    setMatchingError('')
                  }}
                  required
                >
                  <option value="">Choose a candidate</option>

                  {candidates.map((candidate) => (
                    <option key={candidate._id} value={candidate._id}>
                      {candidate.fullName} — {candidate.email}
                    </option>
                  ))}
                </select>

                {candidates.length === 0 && (
                  <small className="text-secondary">
                    Add a candidate before generating a matching report.
                  </small>
                )}
              </div>

              {selectedJob && (
                <div className="col-12">
                  <div className="bg-light rounded p-3">
                    <h6 className="fw-bold">{selectedJob.title}</h6>

                    <p className="small mb-1">
                      <strong>Department:</strong> {selectedJob.department}
                    </p>

                    <p className="small mb-1">
                      <strong>Required skills:</strong>{' '}
                      {Array.isArray(selectedJob.requiredSkills)
                        ? selectedJob.requiredSkills.join(', ')
                        : selectedJob.requiredSkills || 'Not specified'}
                    </p>

                    <p className="small mb-0">
                      <strong>Minimum experience:</strong>{' '}
                      {selectedJob.minimumExperience ?? 0} years
                    </p>
                  </div>
                </div>
              )}

              {selectedCandidate && (
                <div className="col-12">
                  <div className="bg-light rounded p-3">
                    <h6 className="fw-bold">{selectedCandidate.fullName}</h6>

                    <p className="small mb-1">
                      <strong>Skills:</strong>{' '}
                      {selectedCandidate.skills?.join(', ') || 'Not specified'}
                    </p>

                    <p className="small mb-0">
                      <strong>Experience:</strong>{' '}
                      {selectedCandidate.experience ?? 0} years
                    </p>
                  </div>
                </div>
              )}

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={
                    matchingResume ||
                    jobs.length === 0 ||
                    candidates.length === 0
                  }
                >
                  {matchingResume
                    ? 'Analyzing Resume...'
                    : 'Match Resume to Job'}
                </button>
              </div>
            </div>
          </form>

          {matchingReport && (
            <div className="border rounded p-3 p-md-4 mt-4">
              <p className="text-secondary mb-0">
                {selectedCandidate?.fullName || 'Selected candidate'}
                {selectedJob ? ` for ${selectedJob.title}` : ''}
              </p>

              {renderMatchingReport(matchingReport)}
            </div>
          )}
        </div>
      </div>

      {/* Saved Matching History */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold mb-1">Resume Matching History</h4>

              <p className="text-secondary mb-0">
                Previously generated reports saved in MongoDB
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-primary mt-2 mt-md-0"
              onClick={fetchMatchingHistory}
              disabled={loadingHistory}
            >
              {loadingHistory ? 'Loading...' : 'Refresh History'}
            </button>
          </div>

          {historyError && (
            <div className="alert alert-danger">{historyError}</div>
          )}

          {loadingHistory && matchingHistory.length === 0 ? (
            <p className="text-secondary">Loading matching history...</p>
          ) : matchingHistory.length === 0 ? (
            <div className="text-center py-4">
              <h6>No saved matching reports</h6>

              <p className="text-secondary mb-0">
                Generate a resume-to-job match to create your first report.
              </p>
            </div>
          ) : (
            <>
              <p className="small text-secondary">
                {matchingHistory.length} saved report
                {matchingHistory.length !== 1 ? 's' : ''}
              </p>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Candidate</th>
                      <th>Job</th>
                      <th>Department</th>
                      <th>Match Score</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {matchingHistory.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-semibold">
                            {item.candidate?.fullName ||
                              'Candidate unavailable'}
                          </div>

                          <small className="text-secondary">
                            {item.candidate?.email || ''}
                          </small>
                        </td>

                        <td>{item.job?.title || 'Job unavailable'}</td>

                        <td>{item.job?.department || '—'}</td>

                        <td>
                          <span
                            className={`badge ${
                              item.matchScore >= 75
                                ? 'bg-success'
                                : item.matchScore >= 50
                                  ? 'bg-warning text-dark'
                                  : 'bg-secondary'
                            }`}
                          >
                            {item.matchScore ?? '—'}%
                          </span>
                        </td>

                        <td>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : '—'}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              setSelectedHistoryReport(
                                selectedHistoryReport?._id === item._id
                                  ? null
                                  : item
                              )
                            }
                          >
                            {selectedHistoryReport?._id === item._id
                              ? 'Hide Report'
                              : 'View Report'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedHistoryReport && (
                <div className="border rounded p-3 p-md-4 mt-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start">
                    <div>
                      <h5 className="fw-bold mb-1">
                        Saved Matching Report
                      </h5>

                      <p className="text-secondary mb-0">
                        {selectedHistoryReport.candidate?.fullName ||
                          'Candidate unavailable'}
                        {' — '}
                        {selectedHistoryReport.job?.title ||
                          'Job unavailable'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mt-2"
                      onClick={() => setSelectedHistoryReport(null)}
                    >
                      Close
                    </button>
                  </div>

                  {renderMatchingReport(selectedHistoryReport)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Candidate Comparison */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="mb-3">
            <h4 className="fw-bold mb-1">Candidate Comparison</h4>

            <p className="text-secondary mb-0">
              Compare candidates using their saved AI matching reports for the
              same job.
            </p>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">
              Select Job to Compare Candidates
            </label>

            <select
              className="form-select"
              value={comparisonJobId}
              onChange={handleComparisonJobChange}
            >
              <option value="">Choose a job</option>

              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} — {job.department}
                </option>
              ))}
            </select>
          </div>

          {!comparisonJobId ? (
            <div className="alert alert-light border mb-0">
              Select a job to view candidates who have saved matching reports
              for it.
            </div>
          ) : comparisonReports.length === 0 ? (
            <div className="alert alert-info mb-0">
              <strong>No matching reports found for this job.</strong>
              <p className="mb-0 mt-1">
                Use AI Resume-to-Job Matching above to generate reports for at
                least two candidates for the selected job. Then refresh the
                matching history.
              </p>
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-semibold mb-1">
                    Candidates with Saved Reports
                  </h5>

                  <p className="text-secondary small mb-0">
                    Select at least two candidates. Only each candidate's
                    latest report for this job is used.
                  </p>
                </div>

                <span className="badge bg-primary mt-2 mt-md-0">
                  {selectedComparisonIds.length} selected
                </span>
              </div>

              <div className="row g-3">
                {comparisonReports.map((report) => {
                  const candidateId = report.candidate?._id
                  const isSelected =
                    selectedComparisonIds.includes(candidateId)

                  return (
                    <div
                      className="col-md-6 col-xl-4"
                      key={candidateId}
                    >
                      <label
                        className={`card h-100 ${
                          isSelected
                            ? 'border-primary shadow-sm'
                            : 'border'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-body">
                          <div className="form-check mb-3">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`compare-${candidateId}`}
                              checked={isSelected}
                              onChange={(event) =>
                                handleComparisonSelection(
                                  candidateId,
                                  event.target.checked
                                )
                              }
                            />

                            <span className="form-check-label fw-semibold">
                              Select candidate
                            </span>
                          </div>

                          <h6 className="fw-bold mb-1">
                            {report.candidate?.fullName ||
                              'Candidate unavailable'}
                          </h6>

                          <p className="small text-secondary mb-3">
                            {report.candidate?.email || 'Email unavailable'}
                          </p>

                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="small text-secondary">
                              Match Score
                            </span>

                            <span
                              className={`badge ${
                                report.matchScore >= 75
                                  ? 'bg-success'
                                  : report.matchScore >= 50
                                    ? 'bg-warning text-dark'
                                    : 'bg-secondary'
                              }`}
                            >
                              {report.matchScore ?? '—'}%
                            </span>
                          </div>

                          <p className="small mb-2">
                            <strong>Matching skills:</strong>{' '}
                            {report.matchingSkills?.length || 0}
                          </p>

                          <p className="small mb-2">
                            <strong>Missing skills:</strong>{' '}
                            {report.missingSkills?.length || 0}
                          </p>

                          <p className="small mb-2">
                            <strong>Experience:</strong>{' '}
                            {report.experienceAssessment?.candidateYears ??
                              '—'}{' '}
                            years
                          </p>

                          <p className="small text-secondary mb-0">
                            Latest report:{' '}
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString()
                              : 'Date unavailable'}
                          </p>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCompareCandidates}
                  disabled={selectedComparisonIds.length < 2}
                >
                  Compare Selected Candidates
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSelectedComparisonIds([])
                    setShowComparison(false)
                    setMessage('')
                  }}
                  disabled={selectedComparisonIds.length === 0}
                >
                  Clear Selection
                </button>
              </div>

              {selectedComparisonIds.length === 1 && (
                <p className="small text-warning mt-2 mb-0">
                  Select at least one more candidate to enable comparison.
                </p>
              )}

              {showComparison && selectedComparisonReports.length >= 2 && (
                <div className="mt-5">
                  <div className="mb-3">
                    <h5 className="fw-bold mb-1">
                      Side-by-Side Comparison
                    </h5>

                    <p className="text-secondary mb-0">
                      Job:{' '}
                      {jobs.find((job) => job._id === comparisonJobId)?.title ||
                        'Selected job'}
                    </p>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-bordered align-top">
                      <thead className="table-light">
                        <tr>
                          <th style={{ minWidth: '160px' }}>Criteria</th>

                          {selectedComparisonReports.map((report) => (
                            <th
                              key={report.candidate?._id}
                              style={{ minWidth: '240px' }}
                            >
                              {report.candidate?.fullName ||
                                'Candidate unavailable'}

                              <div className="small text-secondary fw-normal">
                                {report.candidate?.email || ''}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <th>Match Score</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              <span
                                className={`badge fs-6 ${
                                  report.matchScore >= 75
                                    ? 'bg-success'
                                    : report.matchScore >= 50
                                      ? 'bg-warning text-dark'
                                      : 'bg-secondary'
                                }`}
                              >
                                {report.matchScore ?? '—'}%
                              </span>
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Summary</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {report.summary || 'No summary available.'}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Matching Skills</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {report.matchingSkills?.length ? (
                                <ul className="mb-0 ps-3">
                                  {report.matchingSkills.map(
                                    (item, index) => (
                                      <li key={`${item.skill}-${index}`}>
                                        <strong>{item.skill}</strong>

                                        {item.evidence && (
                                          <div className="small text-secondary mb-2">
                                            {item.evidence}
                                          </div>
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <span className="text-secondary">
                                  No matching skills identified.
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Missing Skills</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {formatList(
                                report.missingSkills,
                                'No missing skills identified.'
                              )}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Candidate Experience</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {report.experienceAssessment?.candidateYears ??
                                '—'}{' '}
                              years
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Required Experience</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {report.experienceAssessment?.requiredYears ??
                                '—'}{' '}
                              years
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Meets Experience Requirement</th>

                          {selectedComparisonReports.map((report) => {
                            const experience =
                              report.experienceAssessment

                            return (
                              <td key={report.candidate?._id}>
                                {typeof experience?.meetsRequirement ===
                                'boolean' ? (
                                  <span
                                    className={`badge ${
                                      experience.meetsRequirement
                                        ? 'bg-success'
                                        : 'bg-warning text-dark'
                                    }`}
                                  >
                                    {experience.meetsRequirement ? 'Yes' : 'No'}
                                  </span>
                                ) : (
                                  <span className="text-secondary">
                                    Not assessed
                                  </span>
                                )}

                                {experience?.explanation && (
                                  <p className="small text-secondary mt-2 mb-0">
                                    {experience.explanation}
                                  </p>
                                )}
                              </td>
                            )
                          })}
                        </tr>

                        <tr>
                          <th>Strengths</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {formatList(
                                report.strengths,
                                'No strengths listed.'
                              )}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Areas to Improve</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {formatList(
                                report.areasToImprove,
                                'No improvement areas listed.'
                              )}
                            </td>
                          ))}
                        </tr>

                        <tr>
                          <th>Report Date</th>

                          {selectedComparisonReports.map((report) => (
                            <td key={report.candidate?._id}>
                              {report.createdAt
                                ? new Date(report.createdAt).toLocaleString()
                                : '—'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="alert alert-warning small mb-0">
                    <strong>Important:</strong> AI-generated scores and
                    assessments may be inaccurate. Use this comparison as a
                    decision-support tool, not as an automatic hiring
                    decision. Verify candidate information and evaluate all
                    candidates using consistent, job-related criteria.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Candidate Form */}
      {showForm && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-4">Add New Candidate</h4>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Full Name</label>

                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Candidate name"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Email</label>

                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="candidate@example.com"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Phone</label>

                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Location</label>

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
                  <label className="form-label fw-semibold">Education</label>

                  <input
                    type="text"
                    name="education"
                    className="form-control"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. B.Tech Computer Science"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Experience (Years)
                  </label>

                  <input
                    type="number"
                    name="experience"
                    className="form-control"
                    min="0"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Skills</label>

                  <input
                    type="text"
                    name="skills"
                    className="form-control"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, MongoDB, JavaScript"
                    required
                  />

                  <small className="text-secondary">
                    Separate skills using commas
                  </small>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Resume / Candidate Summary
                  </label>

                  <textarea
                    name="resumeText"
                    className="form-control"
                    rows="5"
                    value={formData.resumeText}
                    onChange={handleChange}
                    placeholder="Paste resume text or candidate summary..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Upload Resume (PDF)
                  </label>

                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0]

                      if (file && file.size > 5 * 1024 * 1024) {
                        setMessage('PDF file must be 5 MB or smaller.')
                        event.target.value = ''
                        setResumeFile(null)
                        return
                      }

                      setMessage('')
                      setResumeFile(file || null)
                    }}
                  />

                  <small className="text-secondary">
                    Optional. Upload a PDF file up to 5 MB. Its readable text
                    will be extracted automatically for AI analysis.
                  </small>

                  {resumeFile && (
                    <p className="small text-success mt-2 mb-0">
                      Selected: {resumeFile.name}
                    </p>
                  )}
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-success px-4">
                    Add Candidate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Candidates</h4>

            <p className="text-secondary mb-0">
              {candidates.length} candidate
              {candidates.length !== 1 ? 's' : ''} in the system
            </p>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-5">
              <h5>No candidates found</h5>

              <p className="text-secondary">
                Add a candidate to get started.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {candidates.map((candidate) => (
                <div className="col-md-6 col-xl-4" key={candidate._id}>
                  <div className="card h-100 border shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="fw-bold mb-1">
                            {candidate.fullName}
                          </h5>

                          <small className="text-secondary">
                            {candidate.email}
                          </small>
                        </div>

                        <span className="badge bg-success">
                          {candidate.status}
                        </span>
                      </div>

                      <p className="mb-2">
                        <strong>Education:</strong> {candidate.education}
                      </p>

                      <p className="mb-2">
                        <strong>Experience:</strong> {candidate.experience} year
                        {candidate.experience !== 1 ? 's' : ''}
                      </p>

                      <p className="mb-3">
                        <strong>Location:</strong> {candidate.location}
                      </p>

                      <div className="mb-3">
                        {candidate.skills?.map((skill) => (
                          <span
                            key={skill}
                            className="badge text-bg-light border me-1 mb-1"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {candidate.resumeText && (
                        <p className="text-secondary small">
                          {candidate.resumeText}
                        </p>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100 mt-2"
                        onClick={() => handleAnalyzeCandidate(candidate)}
                        disabled={analyzingCandidateId === candidate._id}
                      >
                        {analyzingCandidateId === candidate._id
                          ? 'Analyzing...'
                          : candidateAnalyses[candidate._id]
                            ? 'Analyze Again'
                            : 'Analyze with AI'}
                      </button>

                      {candidateAnalyses[candidate._id] && (
                        <div className="border rounded p-3 mt-3 bg-light">
                          <h6 className="fw-bold mb-3">
                            AI Profile Analysis
                          </h6>

                          <p className="small mb-2">
                            <strong>Skills:</strong>{' '}
                            {candidateAnalyses[candidate._id].skills?.join(', ') ||
                              'None specified'}
                          </p>

                          <p className="small mb-2">
                            <strong>Experience:</strong>{' '}
                            {candidateAnalyses[candidate._id].experience ?? 0} years
                          </p>

                          <p className="small mb-2">
                            <strong>Education:</strong>{' '}
                            {candidateAnalyses[candidate._id].education?.join(', ') ||
                              'None specified'}
                          </p>

                          <p className="small mb-2">
                            <strong>Certifications:</strong>{' '}
                            {candidateAnalyses[candidate._id].certifications?.join(', ') ||
                              'None specified'}
                          </p>

                          <p className="small mb-2">
                            <strong>Projects:</strong>{' '}
                            {candidateAnalyses[candidate._id].projects?.join(', ') ||
                              'None specified'}
                          </p>

                          <p className="small mb-2">
                            <strong>Location:</strong>{' '}
                            {candidateAnalyses[candidate._id].location ||
                              'Not specified'}
                          </p>

                          <p className="small mb-2">
                            <strong>Summary:</strong>{' '}
                            {candidateAnalyses[candidate._id].summary ||
                              'No summary available'}
                          </p>

                          <p className="small mb-0">
                            <strong>Other Information:</strong>{' '}
                            {candidateAnalyses[candidate._id].otherInformation?.join(', ') ||
                              'None specified'}
                          </p>

                          <div className="alert alert-warning small mt-3 mb-0">
                            AI-generated information may be incomplete or
                            inaccurate. Verify it against the original profile
                            before using it. This analysis does not change the
                            saved candidate record or make a hiring decision.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Candidates