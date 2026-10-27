import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000/api'

function RecruitmentRecommendations() {
const [jobs, setJobs] = useState([])
const [jobId, setJobId] = useState('')
const [jobsLoading, setJobsLoading] = useState(true)

const [candidates, setCandidates] = useState([])
const [candidateId, setCandidateId] = useState('')
const [candidatesLoading, setCandidatesLoading] = useState(true)

const [matchData, setMatchData] = useState(null)
const [matchingLoading, setMatchingLoading] = useState(false)
const [matchError, setMatchError] = useState('')

const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

const [activeFeature, setActiveFeature] = useState('resume')

// Load jobs and candidates.
useEffect(() => {
const loadData = async () => {
const token = localStorage.getItem('token')


  if (!token) {
    setError('Please log in to continue.')
    setMatchError('Please log in to continue.')
    setJobsLoading(false)
    setCandidatesLoading(false)
    return
  }

  const headers = {
    Authorization: `Bearer ${token}`
  }

  try {
    const [jobsResponse, candidatesResponse] = await Promise.all([
      fetch(`${API_URL}/jobs`, { headers }),
      fetch(`${API_URL}/candidates`, { headers })
    ])

    const [jobsResult, candidatesResult] = await Promise.all([
      jobsResponse.json(),
      candidatesResponse.json()
    ])

    if (!jobsResponse.ok || !jobsResult.success) {
      throw new Error(jobsResult.message || 'Unable to load jobs.')
    }

    if (!candidatesResponse.ok || !candidatesResult.success) {
      throw new Error(
        candidatesResult.message || 'Unable to load candidates.'
      )
    }

    const availableJobs = Array.isArray(jobsResult.jobs)
      ? jobsResult.jobs
      : []

    const availableCandidates = Array.isArray(
      candidatesResult.candidates
    )
      ? candidatesResult.candidates
      : []

    setJobs(availableJobs)
    setCandidates(availableCandidates)

    if (availableJobs.length > 0) {
      setJobId(String(availableJobs[0]._id))
    }

    const candidateWithResume = availableCandidates.find(
      (candidate) => candidate.resumeText?.trim()
    )

    if (candidateWithResume) {
      setCandidateId(String(candidateWithResume._id))
    } else if (availableCandidates.length > 0) {
      setCandidateId(String(availableCandidates[0]._id))
    }
  } catch (err) {
    setError(err.message || 'Unable to load jobs.')
    setMatchError(err.message || 'Unable to load jobs and candidates.')
  } finally {
    setJobsLoading(false)
    setCandidatesLoading(false)
  }
}

loadData()


}, [])

// Run AI resume-to-job matching.
const matchResumeToJob = async (event) => {
event.preventDefault()


if (!jobId || !candidateId) {
  setMatchError('Please select both a job and a candidate.')
  return
}

setMatchingLoading(true)
setMatchError('')
setMatchData(null)

try {
  const token = localStorage.getItem('token')

  if (!token) {
    throw new Error('Please log in to continue.')
  }

  const response = await fetch(`${API_URL}/ai/resume-match`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobId,
      candidateId
    })
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Unable to analyze this resume.'
    )
  }

  setMatchData(result)
} catch (err) {
  setMatchError(
    err.message || 'Something went wrong during resume matching.'
  )
} finally {
  setMatchingLoading(false)
}


}

// Generate AI recruitment recommendations.
const generateRecommendations = async (event) => {
event.preventDefault()


if (!jobId) {
  setError('Please select a job first.')
  return
}

setLoading(true)
setError('')
setData(null)

try {
  const token = localStorage.getItem('token')

  if (!token) {
    throw new Error('Please log in to continue.')
  }

  const response = await fetch(
    `${API_URL}/ai/${jobId}/recommendations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        'Unable to generate recruitment recommendations.'
    )
  }

  setData(result)
} catch (err) {
  setError(
    err.message ||
      'Something went wrong while generating recommendations.'
  )
} finally {
  setLoading(false)
}


}

const report = matchData?.report

const recommendations =
data?.recommendations?.recommendations || []

const interviewQuestions =
data?.recommendations?.interviewQuestions || []

return ( <div className="container py-4"> <div className="mb-4"> <h2>AI Recruitment Tools</h2> <p className="text-muted">
Analyze resumes against job requirements and generate
recruitment recommendations. </p> </div>


  {/* Feature selector */}
  <div className="d-flex flex-wrap gap-2 mb-4">
    <button
      type="button"
      className={`btn ${
        activeFeature === 'resume'
          ? 'btn-primary'
          : 'btn-outline-primary'
      }`}
      onClick={() => setActiveFeature('resume')}
    >
      AI Resume-to-Job Matching
    </button>

    <button
      type="button"
      className={`btn ${
        activeFeature === 'recommendations'
          ? 'btn-primary'
          : 'btn-outline-primary'
      }`}
      onClick={() => setActiveFeature('recommendations')}
    >
      AI Recruitment Recommendations
    </button>
  </div>

  {/* Resume-to-job matching */}
  {activeFeature === 'resume' && (
    <>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-3">AI Resume-to-Job Matching</h4>

          <p className="text-muted">
            Select a job and candidate to evaluate resume evidence,
            matching skills, experience, and interview topics.
          </p>

          {jobsLoading || candidatesLoading ? (
            <p className="text-muted mb-0">
              Loading jobs and candidates...
            </p>
          ) : jobs.length === 0 || candidates.length === 0 ? (
            <div className="alert alert-warning mb-0">
              {jobs.length === 0 &&
              candidates.length === 0
                ? 'Create a job and add a candidate before running matching.'
                : jobs.length === 0
                  ? 'Create a job before running resume matching.'
                  : 'Add a candidate before running resume matching.'}
            </div>
          ) : (
            <form onSubmit={matchResumeToJob}>
              <div className="mb-3">
                <label
                  htmlFor="resumeMatchJob"
                  className="form-label fw-semibold"
                >
                  Select Job
                </label>

                <select
                  id="resumeMatchJob"
                  className="form-select"
                  value={jobId}
                  onChange={(event) => {
                    setJobId(event.target.value)
                    setMatchData(null)
                    setMatchError('')
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
              </div>

              <div className="mb-3">
                <label
                  htmlFor="resumeMatchCandidate"
                  className="form-label fw-semibold"
                >
                  Select Candidate
                </label>

                <select
                  id="resumeMatchCandidate"
                  className="form-select"
                  value={candidateId}
                  onChange={(event) => {
                    setCandidateId(event.target.value)
                    setMatchData(null)
                    setMatchError('')
                  }}
                  required
                >
                  <option value="" disabled>
                    Select a candidate
                  </option>

                  {candidates.map((candidate) => (
                    <option
                      key={candidate._id}
                      value={candidate._id}
                    >
                      {candidate.fullName}
                      {candidate.resumeText?.trim()
                        ? ' — Resume available'
                        : ' — No resume text'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  matchingLoading ||
                  jobsLoading ||
                  candidatesLoading ||
                  !jobId ||
                  !candidateId
                }
              >
                {matchingLoading
                  ? 'Analyzing Resume...'
                  : 'Analyze Resume Match'}
              </button>
            </form>
          )}
        </div>
      </div>

      {matchError && (
        <div className="alert alert-danger" role="alert">
          {matchError}
        </div>
      )}

      {report && (
        <>
          {/* Match score and summary */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <span className="badge bg-primary mb-2">
                    AI Resume Analysis
                  </span>

                  <h3 className="mb-1">
                    {matchData.candidate?.name || 'Candidate'}
                  </h3>

                  <p className="text-muted mb-0">
                    {matchData.job?.title || 'Selected Job'}
                    {matchData.job?.department
                      ? ` — ${matchData.job.department}`
                      : ''}
                  </p>
                </div>

                <div className="text-center border rounded p-3">
                  <div className="text-muted small">
                    Resume Match Score
                  </div>

                  <div
                    className={`display-5 fw-bold ${
                      report.matchScore >= 80
                        ? 'text-success'
                        : report.matchScore >= 60
                          ? 'text-warning'
                          : 'text-danger'
                    }`}
                  >
                    {report.matchScore ?? 0}%
                  </div>
                </div>
              </div>

              <div
                className="progress mt-3 mb-3"
                style={{ height: '12px' }}
                role="progressbar"
                aria-label="Resume match score"
                aria-valuenow={report.matchScore ?? 0}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={`progress-bar ${
                    report.matchScore >= 80
                      ? 'bg-success'
                      : report.matchScore >= 60
                        ? 'bg-warning'
                        : 'bg-danger'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, Number(report.matchScore) || 0)
                    )}%`
                  }}
                />
              </div>

              <h5>AI Summary</h5>
              <p className="mb-0">
                {report.summary || 'No summary available.'}
              </p>
            </div>
          </div>

          {/* Matching and missing skills */}
          <div className="row g-3 mb-4">
            <div className="col-lg-7">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="mb-3">Matching Skills</h4>

                  {report.matchingSkills?.length ? (
                    report.matchingSkills.map((item, index) => (
                      <div
                        key={`${item.skill}-${index}`}
                        className="border rounded p-3 mb-3"
                      >
                        <h6 className="text-success mb-2">
                          ✓ {item.skill}
                        </h6>
                        <p className="mb-0">
                          {item.evidence ||
                            'No resume evidence provided.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">
                      No matching skills were identified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="mb-3">Missing Skills</h4>

                  {report.missingSkills?.length ? (
                    <ul className="mb-0">
                      {report.missingSkills.map((skill, index) => (
                        <li key={`${skill}-${index}`}>{skill}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="alert alert-success mb-0">
                      No missing skills were identified by the AI.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Experience assessment */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-3">Experience Assessment</h4>

              <div className="row g-3">
                <div className="col-sm-4">
                  <div className="border rounded p-3 h-100">
                    <div className="text-muted small">
                      Candidate Experience
                    </div>
                    <h4 className="mb-0">
                      {report.experienceAssessment?.candidateYears ?? 0}{' '}
                      years
                    </h4>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="border rounded p-3 h-100">
                    <div className="text-muted small">
                      Required Experience
                    </div>
                    <h4 className="mb-0">
                      {report.experienceAssessment?.requiredYears ?? 0}{' '}
                      years
                    </h4>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="border rounded p-3 h-100">
                    <div className="text-muted small">
                      Requirement Status
                    </div>
                    <span
                      className={`badge mt-2 ${
                        report.experienceAssessment?.meetsRequirement
                          ? 'bg-success'
                          : 'bg-danger'
                      }`}
                    >
                      {report.experienceAssessment?.meetsRequirement
                        ? 'Requirement Met'
                        : 'Requirement Not Met'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 mb-0">
                {report.experienceAssessment?.explanation ||
                  'No experience explanation available.'}
              </p>
            </div>
          </div>

          {/* Strengths and improvements */}
          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="text-success mb-3">Strengths</h4>

                  {report.strengths?.length ? (
                    <ul className="mb-0">
                      {report.strengths.map((item, index) => (
                        <li className="mb-2" key={index}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">
                      No strengths listed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="text-warning mb-3">
                    Areas to Improve or Verify
                  </h4>

                  {report.areasToImprove?.length ? (
                    <ul className="mb-0">
                      {report.areasToImprove.map((item, index) => (
                        <li className="mb-2" key={index}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">
                      No improvement areas listed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interview questions */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-3">Suggested Interview Questions</h4>

              {report.interviewQuestions?.length ? (
                <ol className="mb-0">
                  {report.interviewQuestions.map((question, index) => (
                    <li className="mb-3" key={index}>
                      {question}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted mb-0">
                  No interview questions available.
                </p>
              )}
            </div>
          </div>

          <div className="alert alert-info">
            <strong>Important:</strong> The AI match score and
            observations are advisory. Verify resume claims during
            screening and interviews. This analysis does not change
            application status or automatically hire or reject a candidate.
          </div>
        </>
      )}
    </>
  )}

  {/* Existing AI recruitment recommendations */}
  {activeFeature === 'recommendations' && (
    <>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-3">AI Recruitment Recommendations</h4>

          <p className="text-muted">
            Get AI-generated recruitment insights based on existing
            candidate matching results.
          </p>

          {jobsLoading ? (
            <p className="text-muted mb-0">
              Loading available jobs...
            </p>
          ) : jobs.length === 0 ? (
            <div className="alert alert-warning mb-0">
              No jobs are available. Please create a job first.
            </div>
          ) : (
            <form onSubmit={generateRecommendations}>
              <label
                htmlFor="recommendationJobId"
                className="form-label fw-semibold"
              >
                Job Title
              </label>

              <select
                id="recommendationJobId"
                className="form-select mb-3"
                value={jobId}
                onChange={(event) => {
                  setJobId(event.target.value)
                  setData(null)
                  setError('')
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
                disabled={loading || !jobId}
              >
                {loading
                  ? 'Generating Recommendations...'
                  : 'Generate AI Recommendations'}
              </button>
            </form>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4>{data.job?.title || 'Selected Job'}</h4>

              {data.job?.location && (
                <p className="text-muted mb-0">
                  Location: {data.job.location}
                </p>
              )}

              <h5 className="mt-4">Recruitment Summary</h5>
              <p>
                {data.recommendations?.summary ||
                  'No summary available.'}
              </p>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-3">Candidate Recommendations</h4>

              {recommendations.length === 0 ? (
                <p className="text-muted">
                  No candidate recommendations available.
                </p>
              ) : (
                recommendations.map((candidate, index) => (
                  <div
                    key={candidate.candidateId || index}
                    className="border rounded p-3 mb-3"
                  >
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h5 className="mb-0">
                        {candidate.candidateName ||
                          `Candidate ${index + 1}`}
                      </h5>

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
                        <strong>Reason:</strong> {candidate.reason}
                      </p>
                    )}

                    <div className="mt-3">
                      <strong>Skills to Verify</strong>

                      {candidate.skillsToVerify?.length ? (
                        <ul className="mt-2">
                          {candidate.skillsToVerify.map(
                            (skill, skillIndex) => (
                              <li key={skillIndex}>{skill}</li>
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
                      <strong>Information to Clarify</strong>

                      {candidate.informationToClarify?.length ? (
                        <ul className="mt-2">
                          {candidate.informationToClarify.map(
                            (item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
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
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h4 className="mb-3">Suggested Interview Questions</h4>

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
                      <strong>Purpose:</strong> {item.purpose}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="alert alert-info">
            <strong>Important:</strong> These AI-generated
            recommendations are advisory. They do not change existing
            candidate scores or eligibility.
          </div>
        </>
      )}
    </>
  )}
</div>


)
}

export default RecruitmentRecommendations
