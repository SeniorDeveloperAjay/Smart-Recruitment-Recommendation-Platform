import { useEffect, useState } from 'react'

function RecruitmentAgent() {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [jobsLoading, setJobsLoading] = useState(true)

  const [agentData, setAgentData] = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)

  const [selectedApplicationIds, setSelectedApplicationIds] =
    useState([])

  const [shortlisting, setShortlisting] = useState(false)
  const [shortlistMessage, setShortlistMessage] = useState('')
  const [shortlistError, setShortlistError] = useState('')

  const [error, setError] = useState('')

  // Load jobs from the backend.
  useEffect(() => {
    const loadJobs = async () => {
      try {
        setJobsLoading(true)
        setError('')

        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Please log in to continue.')
        }

        const response = await fetch(
          'http://localhost:5000/api/jobs',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load jobs.'
          )
        }

        const availableJobs = Array.isArray(result.jobs)
          ? result.jobs
          : []

        setJobs(availableJobs)

        if (availableJobs.length > 0) {
          setJobId(String(availableJobs[0]._id))
        }
      } catch (err) {
        setError(
          err.message || 'Unable to load available jobs.'
        )
      } finally {
        setJobsLoading(false)
      }
    }

    loadJobs()
  }, [])

  // Run the AI recruitment automation agent.
  const runAgent = async (event) => {
    if (event) {
      event.preventDefault()
    }

    if (!jobId) {
      setError('Please select a job first.')
      return
    }

    try {
      setAgentLoading(true)
      setError('')
      setShortlistMessage('')
      setShortlistError('')
      setSelectedApplicationIds([])

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Please log in to continue.')
      }

      const response = await fetch(
        `http://localhost:5000/api/ai/${jobId}/agent`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            result.message ||
            'Unable to run the recruitment agent.'
        )
      }

      setAgentData(result)
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong while running the recruitment agent.'
      )
    } finally {
      setAgentLoading(false)
    }
  }

  // Select or deselect an application for shortlisting.
  const toggleApplicationSelection = (
    applicationId,
    checked
  ) => {
    setSelectedApplicationIds((previous) => {
      if (checked) {
        return previous.includes(applicationId)
          ? previous
          : [...previous, applicationId]
      }

      return previous.filter((id) => id !== applicationId)
    })

    setShortlistMessage('')
    setShortlistError('')
  }

  // Shortlist only the applications explicitly approved by the recruiter.
  const handleShortlistSelected = async () => {
    if (!agentData?.job?.id || selectedApplicationIds.length === 0) {
      setShortlistError(
        'Select at least one eligible candidate with an existing application.'
      )
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to shortlist ${selectedApplicationIds.length} selected candidate(s)?`
    )

    if (!confirmed) {
      return
    }

    try {
      setShortlisting(true)
      setShortlistMessage('')
      setShortlistError('')

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Please log in to continue.')
      }

      const response = await fetch(
        'http://localhost:5000/api/applications/shortlist',
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobId: agentData.job.id,
            applicationIds: selectedApplicationIds
          })
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to shortlist selected candidates.'
        )
      }

      setShortlistMessage(
        result.message || 'Selected candidates shortlisted successfully.'
      )

      setSelectedApplicationIds([])

      // Refresh agent data to display the latest application statuses.
      await runAgent()
    } catch (err) {
      setShortlistError(
        err.message || 'Shortlisting failed. Please try again.'
      )
    } finally {
      setShortlisting(false)
    }
  }

  const summary = agentData?.summary

  const recommendations =
    agentData?.recommendations?.recommendations || []

  const interviewQuestions =
    agentData?.recommendations?.interviewQuestions || []

  const rankedCandidates =
    agentData?.rankedCandidates || []

  // Only eligible candidates with an existing Applied application
  // can be selected for shortlisting.
  const selectableCandidates = rankedCandidates.filter(
    (candidate) =>
      candidate.eligibility?.eligible === true &&
      Boolean(candidate.applicationId) &&
      candidate.applicationStatus === 'Applied'
  )

  return (
    <div className="container py-4">
      {/* Page heading */}
      <div className="mb-4">
        <h2>AI Recruitment Automation Agent</h2>

        <p className="text-muted">
          Analyze candidates, evaluate eligibility, and generate
          AI-powered recruitment recommendations.
        </p>
      </div>

      {/* Job selection */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Select a Job</h5>

          {jobsLoading ? (
            <p className="text-muted mb-0">
              Loading available jobs...
            </p>
          ) : jobs.length === 0 ? (
            <div className="alert alert-warning mb-0">
              No jobs are available. Create a job before running
              the recruitment agent.
            </div>
          ) : (
            <form onSubmit={runAgent}>
              <label
                htmlFor="agentJobId"
                className="form-label fw-semibold"
              >
                Job Title
              </label>

              <select
                id="agentJobId"
                className="form-select mb-3"
                value={jobId}
                onChange={(event) => {
                  setJobId(event.target.value)
                  setAgentData(null)
                  setSelectedApplicationIds([])
                  setError('')
                  setShortlistMessage('')
                  setShortlistError('')
                }}
                required
              >
                <option value="" disabled>
                  Select a job
                </option>

                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                    {job.location ? ` — ${job.location}` : ''}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={agentLoading || !jobId || shortlisting}
              >
                {agentLoading
                  ? 'Running AI Agent...'
                  : 'Run AI Recruitment Agent'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Agent results */}
      {agentData && (
        <>
          <div className="alert alert-success">
            <strong>Workflow completed!</strong>{' '}
            {agentData.workflow?.name}
          </div>

          {/* Summary cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted">
                    Candidates Analyzed
                  </h6>
                  <h2>{summary?.totalCandidatesAnalyzed ?? 0}</h2>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted">
                    Eligible Candidates
                  </h6>
                  <h2>{summary?.eligibleCandidates ?? 0}</h2>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted">
                    Proposed Shortlist
                  </h6>
                  <h2>{summary?.proposedShortlist ?? 0}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Ranked candidates and recruiter selection */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-2">Ranked Candidates</h4>

              <p className="text-muted">
                Review the ranking and eligibility results. Select
                eligible candidates with an existing Applied
                application to propose them for shortlisting.
              </p>

              {rankedCandidates.length === 0 ? (
                <p className="text-muted mb-0">
                  No candidates were found for analysis.
                </p>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Select</th>
                          <th>Candidate</th>
                          <th>Eligibility</th>
                          <th>Application Status</th>
                          <th>Matched Skills</th>
                          <th>Missing Skills</th>
                          <th>Match Score</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rankedCandidates.map(
                          (candidate, index) => {
                            const canSelect =
                              candidate.eligibility?.eligible === true &&
                              Boolean(candidate.applicationId) &&
                              candidate.applicationStatus === 'Applied'

                            return (
                              <tr
                                key={
                                  candidate.candidateId || index
                                }
                              >
                                <td>
                                  {canSelect ? (
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={selectedApplicationIds.includes(
                                        candidate.applicationId
                                      )}
                                      disabled={
                                        shortlisting || agentLoading
                                      }
                                      onChange={(event) =>
                                        toggleApplicationSelection(
                                          candidate.applicationId,
                                          event.target.checked
                                        )
                                      }
                                      aria-label={`Select ${
                                        candidate.candidateName ||
                                        `Candidate ${index + 1}`
                                      } for shortlisting`}
                                    />
                                  ) : (
                                    <span
                                      className="text-muted small"
                                    >
                                      —
                                    </span>
                                  )}
                                </td>

                                <td>
                                  <strong>
                                    {candidate.candidateName ||
                                      `Candidate ${index + 1}`}
                                  </strong>
                                </td>

                                <td>
                                  <span
                                    className={`badge ${
                                      candidate.eligibility?.eligible
                                        ? 'bg-success'
                                        : 'bg-secondary'
                                    }`}
                                  >
                                    {candidate.eligibility?.eligible
                                      ? 'Eligible'
                                      : 'Not Eligible'}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`badge ${
                                      candidate.applicationStatus ===
                                      'Applied'
                                        ? 'bg-primary'
                                        : candidate.applicationStatus ===
                                            'Shortlisted'
                                          ? 'bg-success'
                                          : 'bg-secondary'
                                    }`}
                                  >
                                    {candidate.applicationStatus ||
                                      'Unknown'}
                                  </span>
                                </td>

                                <td>
                                  {candidate.matchedSkills?.length
                                    ? candidate.matchedSkills.join(', ')
                                    : 'None'}
                                </td>

                                <td>
                                  {candidate.missingSkills?.length
                                    ? candidate.missingSkills.join(', ')
                                    : 'None'}
                                </td>

                                <td>
                                  {candidate.score?.totalScore ?? 'N/A'}
                                </td>
                              </tr>
                            )
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border rounded p-3 mt-3">
                    <h5>Recruiter Approval</h5>

                    <p className="text-muted">
                      Selected candidates will be marked as
                      Shortlisted only after you confirm the action.
                      Candidates without an existing application
                      cannot be shortlisted here.
                    </p>

                    <p>
                      <strong>Selected:</strong>{' '}
                      {selectedApplicationIds.length}
                    </p>

                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleShortlistSelected}
                      disabled={
                        shortlisting ||
                        agentLoading ||
                        selectedApplicationIds.length === 0
                      }
                    >
                      {shortlisting
                        ? 'Shortlisting...'
                        : `Shortlist Selected Candidates (${selectedApplicationIds.length})`}
                    </button>

                    {shortlistMessage && (
                      <div
                        className="alert alert-success mt-3 mb-0"
                        role="status"
                      >
                        {shortlistMessage}
                      </div>
                    )}

                    {shortlistError && (
                      <div
                        className="alert alert-danger mt-3 mb-0"
                        role="alert"
                      >
                        {shortlistError}
                      </div>
                    )}

                    {selectableCandidates.length === 0 && (
                      <div className="alert alert-info mt-3 mb-0">
                        No eligible candidates with an existing
                        application in Applied status are available
                        for shortlisting.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI recommendations */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4>AI Recruitment Recommendations</h4>

              <p>
                {agentData.recommendations?.summary ||
                  'No recommendation summary available.'}
              </p>

              {recommendations.length === 0 ? (
                <p className="text-muted">
                  No individual recommendations are available.
                </p>
              ) : (
                recommendations.map((candidate, index) => (
                  <div
                    key={candidate.candidateId || index}
                    className="border rounded p-3 mb-3"
                  >
                    <h5>
                      {candidate.candidateName ||
                        `Candidate ${index + 1}`}
                    </h5>

                    {candidate.priority && (
                      <p>
                        <span className="badge bg-primary">
                          {candidate.priority} Priority
                        </span>
                      </p>
                    )}

                    {candidate.reason && (
                      <p>
                        <strong>Reason:</strong> {candidate.reason}
                      </p>
                    )}

                    {candidate.skillsToVerify?.length > 0 && (
                      <div>
                        <strong>Skills to Verify:</strong>
                        <ul className="mt-2">
                          {candidate.skillsToVerify.map(
                            (skill, skillIndex) => (
                              <li key={skillIndex}>{skill}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {candidate.informationToClarify?.length > 0 && (
                      <div>
                        <strong>Information to Clarify:</strong>
                        <ul className="mt-2">
                          {candidate.informationToClarify.map(
                            (item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suggested interview questions */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-3">
                Suggested Interview Questions
              </h4>

              {interviewQuestions.length === 0 ? (
                <p className="text-muted mb-0">
                  No interview questions are available.
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

                    {item.skillAssessed && (
                      <p className="mb-1">
                        <strong>Skill assessed:</strong>{' '}
                        {item.skillAssessed}
                      </p>
                    )}

                    {item.purpose && (
                      <p className="text-muted mb-0">
                        <strong>Purpose:</strong> {item.purpose}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recruiter notice */}
          <div className="alert alert-info">
            <strong>Recruiter review required:</strong>{' '}
            The AI agent provides rankings and recommendations.
            Only candidates you select and explicitly approve are
            shortlisted. Running the agent does not automatically
            shortlist or hire anyone.
          </div>
        </>
      )}
    </div>
  )
}

export default RecruitmentAgent