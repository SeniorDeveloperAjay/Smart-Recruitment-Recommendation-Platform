import { useEffect, useState } from 'react'

function Applications() {
  const [applications, setApplications] = useState([])
  const [matchingResults, setMatchingResults] = useState({})
  const [aiInsights, setAiInsights] = useState({})
  const [aiLoading, setAiLoading] = useState({})
  const [aiErrors, setAiErrors] = useState({})

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [matchingLoading, setMatchingLoading] = useState(false)

  const token = localStorage.getItem('token')

  // Fetch applications
  const fetchApplications = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/applications',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to fetch applications'
        )
      }

      setApplications(data.applications || [])
      setMessage('')
    } catch (error) {
      setMessage(
        error.message || 'Unable to connect to backend'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  // Fetch matching results for jobs associated with applications
  useEffect(() => {
    let cancelled = false

    const fetchMatchingResults = async () => {
      if (!token || applications.length === 0) {
        setMatchingLoading(false)
        return
      }

      const jobIds = [
        ...new Set(
          applications
            .map((application) => application.job?._id)
            .filter(Boolean)
            .map(String)
        )
      ]

      if (jobIds.length === 0) {
        setMatchingLoading(false)
        return
      }

      setMatchingLoading(true)

      try {
        const results = await Promise.all(
          jobIds.map(async (jobId) => {
            try {
              const response = await fetch(
                `http://localhost:5000/api/ai/${jobId}/match`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              )

              const data = await response.json()

              if (!response.ok || !data.success) {
                return {
                  jobId,
                  error:
                    data.message ||
                    'Unable to load matching results'
                }
              }

              return {
                jobId,
                rankedCandidates: Array.isArray(
                  data.rankedCandidates
                )
                  ? data.rankedCandidates
                  : []
              }
            } catch {
              return {
                jobId,
                error: 'Unable to load matching results'
              }
            }
          })
        )

        if (cancelled) {
          return
        }

        const resultsMap = {}

        results.forEach((result) => {
          resultsMap[result.jobId] = result
        })

        setMatchingResults(resultsMap)
      } finally {
        if (!cancelled) {
          setMatchingLoading(false)
        }
      }
    }

    fetchMatchingResults()

    return () => {
      cancelled = true
    }
  }, [applications, token])

  // Update an application's status
  const updateStatus = async (applicationId, status) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to update application status'
        )
      }

      setApplications((previousApplications) =>
        previousApplications.map((application) =>
          application._id === applicationId
            ? {
                ...application,
                status: data.application?.status || status
              }
            : application
        )
      )

      setMessage('Application status updated successfully')
    } catch (error) {
      setMessage(
        error.message ||
          'Unable to update application status'
      )
    }
  }

  // Generate AI recruitment insights for an application
  const generateAIInsights = async (application) => {
    const jobId = application.job?._id
    const applicationId = application._id

    if (!jobId) {
      setAiErrors((previous) => ({
        ...previous,
        [applicationId]: 'The job associated with this application was not found.'
      }))
      return
    }

    if (!token) {
      setAiErrors((previous) => ({
        ...previous,
        [applicationId]: 'Please log in to continue.'
      }))
      return
    }

    setAiLoading((previous) => ({
      ...previous,
      [applicationId]: true
    }))

    setAiErrors((previous) => ({
      ...previous,
      [applicationId]: ''
    }))

    try {
      const response = await fetch(
        `http://localhost:5000/api/ai/${jobId}/recommendations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to generate AI recruitment insights.'
        )
      }

      setAiInsights((previous) => ({
        ...previous,
        [applicationId]: data
      }))
    } catch (error) {
      setAiErrors((previous) => ({
        ...previous,
        [applicationId]:
          error.message ||
          'Something went wrong while generating AI insights.'
      }))
    } finally {
      setAiLoading((previous) => ({
        ...previous,
        [applicationId]: false
      }))
    }
  }

  if (loading) {
    return (
      <div className="container py-5">
        <h2>Loading applications...</h2>
      </div>
    )
  }

  return (
    <div className="container py-5">
      {/* Page heading */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bold">
            Application Management
          </h1>

          <p className="text-muted mb-0">
            Review applications, matching results, and AI recruitment insights.
          </p>
        </div>

        <span className="badge bg-primary fs-6">
          {applications.length} Applications
        </span>
      </div>

      {/* Application messages */}
      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h4>No applications found</h4>

            <p className="text-muted mb-0">
              Applications will appear here when candidates
              are added to jobs.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {applications.map((application) => {
            const applicationId = application._id

            const jobId = application.job?._id
              ? String(application.job._id)
              : ''

            const matchingResult = jobId
              ? matchingResults[jobId]
              : null

            const candidateId = application.candidate?._id
              ? String(application.candidate._id)
              : ''

            const matchedCandidate =
              matchingResult?.rankedCandidates?.find(
                (candidate) =>
                  String(
                    candidate.candidateId ||
                      candidate._id ||
                      ''
                  ) === candidateId
              )

            const aiData = aiInsights[applicationId]

            const recommendations =
              aiData?.recommendations?.recommendations || []

            const interviewQuestions =
              aiData?.recommendations?.interviewQuestions || []

            return (
              <div
                className="col-12"
                key={applicationId}
              >
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    {/* Application information */}
                    <div className="row align-items-start g-4">
                      <div className="col-md-3">
                        <h5 className="fw-bold mb-1">
                          {application.candidate?.fullName ||
                            'Unknown Candidate'}
                        </h5>

                        <p className="text-muted mb-1">
                          {application.candidate?.email}
                        </p>

                        <small>
                          Experience:{' '}
                          {application.candidate?.experience ?? 0}{' '}
                          years
                        </small>

                        {application.candidate?.location && (
                          <p className="small text-muted mt-1 mb-0">
                            {application.candidate.location}
                          </p>
                        )}
                      </div>

                      <div className="col-md-3">
                        <h6 className="fw-bold">
                          {application.job?.title ||
                            'Unknown Job'}
                        </h6>

                        <p className="text-muted mb-1">
                          {application.job?.department}
                        </p>

                        <small>
                          {application.job?.location} •{' '}
                          {application.job?.employmentType}
                        </small>
                      </div>

                      {/* Application status */}
                      <div className="col-md-2">
                        <label
                          htmlFor={`status-${applicationId}`}
                          className="form-label fw-semibold"
                        >
                          Status
                        </label>

                        <select
                          id={`status-${applicationId}`}
                          className="form-select"
                          value={application.status}
                          onChange={(event) =>
                            updateStatus(
                              applicationId,
                              event.target.value
                            )
                          }
                        >
                          <option value="Applied">
                            Applied
                          </option>

                          <option value="Shortlisted">
                            Shortlisted
                          </option>

                          <option value="Interview">
                            Interview
                          </option>

                          <option value="Rejected">
                            Rejected
                          </option>

                          <option value="Hired">
                            Hired
                          </option>
                        </select>
                      </div>

                      {/* Recruiter notes */}
                      <div className="col-md-4">
                        <h6 className="fw-bold">
                          Recruiter Notes
                        </h6>

                        <p className="text-muted mb-2">
                          {application.recruiterNotes ||
                            'No notes added'}
                        </p>

                        <small className="text-muted">
                          Applied:{' '}
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : 'Not available'}
                        </small>
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* Candidate matching analysis */}
                    <section>
                      <h5 className="fw-bold mb-3">
                        Candidate Matching Analysis
                      </h5>

                      {matchingLoading && !matchingResult ? (
                        <p className="text-muted">
                          Loading candidate matching results...
                        </p>
                      ) : matchingResult?.error ? (
                        <div className="alert alert-warning">
                          {matchingResult.error}
                        </div>
                      ) : !matchedCandidate ? (
                        <div className="alert alert-secondary">
                          Matching results are unavailable for this candidate.
                          The candidate may not currently be included in the
                          available candidates returned by the matching service.
                        </div>
                      ) : (
                        <>
                          <div className="row g-3 mb-3">
                            <div className="col-sm-6 col-lg-3">
                              <div className="border rounded p-3 h-100">
                                <p className="text-muted mb-1">
                                  Match Score
                                </p>

                                <h3 className="fw-bold mb-0">
                                  {matchedCandidate.score?.totalScore ?? 0}%
                                </h3>
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                              <div className="border rounded p-3 h-100">
                                <p className="text-muted mb-2">
                                  Eligibility
                                </p>

                                <span
                                  className={`badge ${
                                    matchedCandidate.eligibility?.eligible
                                      ? 'bg-success'
                                      : 'bg-danger'
                                  }`}
                                >
                                  {matchedCandidate.eligibility?.eligible
                                    ? 'Eligible'
                                    : 'Not Eligible'}
                                </span>
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                              <div className="border rounded p-3 h-100">
                                <p className="text-muted mb-1">
                                  Skill Match
                                </p>

                                <h4 className="fw-bold mb-0">
                                  {matchedCandidate.score
                                    ?.skillMatchPercentage ?? 0}%
                                </h4>
                              </div>
                            </div>

                            <div className="col-sm-6 col-lg-3">
                              <div className="border rounded p-3 h-100">
                                <p className="text-muted mb-1">
                                  Experience Match
                                </p>

                                <h4 className="fw-bold mb-0">
                                  {matchedCandidate.score
                                    ?.experienceScore ?? 0}%
                                </h4>
                              </div>
                            </div>
                          </div>

                          <div className="row g-4">
                            <div className="col-md-6">
                              <h6 className="fw-bold">
                                Matched Skills
                              </h6>

                              {matchedCandidate.matchedSkills?.length ? (
                                <div className="d-flex flex-wrap gap-2">
                                  {matchedCandidate.matchedSkills.map(
                                    (skill, index) => (
                                      <span
                                        key={`${skill}-${index}`}
                                        className="badge bg-success"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted">
                                  No required skills matched.
                                </p>
                              )}
                            </div>

                            <div className="col-md-6">
                              <h6 className="fw-bold">
                                Missing Skills
                              </h6>

                              {matchedCandidate.missingSkills?.length ? (
                                <div className="d-flex flex-wrap gap-2">
                                  {matchedCandidate.missingSkills.map(
                                    (skill, index) => (
                                      <span
                                        key={`${skill}-${index}`}
                                        className="badge bg-danger"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted">
                                  No missing required skills.
                                </p>
                              )}
                            </div>
                          </div>

                          {matchedCandidate.explanation && (
                            <div className="alert alert-light border mt-4 mb-0">
                              <h6 className="fw-bold">
                                Matching Explanation
                              </h6>

                              <p className="mb-2">
                                {matchedCandidate.explanation.summary}
                              </p>

                              {matchedCandidate.explanation.reasons
                                ?.length > 0 && (
                                <ul className="mb-0">
                                  {matchedCandidate.explanation.reasons.map(
                                    (reason, index) => (
                                      <li key={index}>
                                        {reason}
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <p className="text-muted small mt-3 mb-0">
                        Matching scores and eligibility are calculated by the
                        existing matching system. They are not changed by AI
                        recommendations.
                      </p>
                    </section>

                    <hr className="my-4" />

                    {/* AI recruitment insights */}
                    <section>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                        <div>
                          <h5 className="fw-bold mb-1">
                            AI Recruitment Insights
                          </h5>

                          <p className="text-muted small mb-0">
                            Generate recruitment guidance and interview
                            questions for this job.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            generateAIInsights(application)
                          }
                          disabled={
                            !jobId || aiLoading[applicationId]
                          }
                        >
                          {aiLoading[applicationId]
                            ? 'Generating Insights...'
                            : aiData
                              ? 'Regenerate AI Insights'
                              : 'Generate AI Recruitment Insights'}
                        </button>
                      </div>

                      {aiErrors[applicationId] && (
                        <div
                          className="alert alert-danger"
                          role="alert"
                        >
                          {aiErrors[applicationId]}
                        </div>
                      )}

                      {aiData && (
                        <div className="mt-4">
                          {/* AI summary */}
                          <div className="card bg-light border-0 mb-4">
                            <div className="card-body">
                              <h6 className="fw-bold">
                                Recruitment Summary
                              </h6>

                              <p className="mb-0">
                                {aiData.recommendations?.summary ||
                                  'No summary available.'}
                              </p>
                            </div>
                          </div>

                          {/* AI candidate recommendations */}
                          <h6 className="fw-bold mb-3">
                            Candidate Recommendations
                          </h6>

                          {recommendations.length === 0 ? (
                            <p className="text-muted">
                              No specific candidate recommendations were
                              returned for this job.
                            </p>
                          ) : (
                            recommendations.map((candidate, index) => (
                              <div
                                key={
                                  candidate.candidateId ||
                                  index
                                }
                                className="border rounded p-3 mb-3"
                              >
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                  <h6 className="fw-bold mb-0">
                                    {candidate.candidateName ||
                                      `Candidate ${index + 1}`}
                                  </h6>

                                  {candidate.priority && (
                                    <span className="badge bg-primary">
                                      {candidate.priority} Priority
                                    </span>
                                  )}
                                </div>

                                {candidate.candidateId && (
                                  <p className="text-muted small mt-2 mb-0">
                                    Candidate ID: {candidate.candidateId}
                                  </p>
                                )}

                                {candidate.reason && (
                                  <p className="mt-3 mb-2">
                                    <strong>Reason:</strong>{' '}
                                    {candidate.reason}
                                  </p>
                                )}

                                <div className="mt-3">
                                  <strong>Skills to Verify</strong>

                                  {candidate.skillsToVerify?.length ? (
                                    <ul className="mt-2">
                                      {candidate.skillsToVerify.map(
                                        (skill, skillIndex) => (
                                          <li key={skillIndex}>
                                            {skill}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-muted mt-2">
                                      No specific skills listed.
                                    </p>
                                  )}
                                </div>

                                <div className="mt-3">
                                  <strong>
                                    Information to Clarify
                                  </strong>

                                  {candidate.informationToClarify?.length ? (
                                    <ul className="mt-2">
                                      {candidate.informationToClarify.map(
                                        (item, itemIndex) => (
                                          <li key={itemIndex}>
                                            {item}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-muted mt-2">
                                      No additional information listed.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}

                          {/* Suggested interview questions */}
                          <h6 className="fw-bold mt-4 mb-3">
                            Suggested Interview Questions
                          </h6>

                          {interviewQuestions.length === 0 ? (
                            <p className="text-muted">
                              No interview questions available.
                            </p>
                          ) : (
                            interviewQuestions.map((item, index) => (
                              <div
                                key={index}
                                className="border-bottom py-3"
                              >
                                <h6>
                                  {index + 1}. {item.question}
                                </h6>

                                <p className="mb-1">
                                  <strong>Skill assessed:</strong>{' '}
                                  {item.skillAssessed}
                                </p>

                                <p className="text-muted mb-0">
                                  <strong>Purpose:</strong>{' '}
                                  {item.purpose}
                                </p>
                              </div>
                            ))
                          )}

                          <div className="alert alert-info mt-4 mb-0">
                            <strong>Important:</strong> These AI-generated
                            insights are advisory. They do not change the
                            candidate's matching score, eligibility, or
                            application status.
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Applications