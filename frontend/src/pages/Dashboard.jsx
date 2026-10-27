import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {}
    } catch {
      return {}
    }
  })

  const [stats, setStats] = useState({
    jobs: 0,
    candidates: 0,
    applications: 0,
    shortlisted: 0,
    interviews: 0,
    hired: 0,
    rejected: 0,
    applied: 0,
  })

  const [jobAnalytics, setJobAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')

    if (!token) {
      setError('Your session has expired. Please log in again.')
      setLoading(false)
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    try {
      const [
        jobsResponse,
        candidatesResponse,
        applicationsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/jobs`, { headers }),
        fetch(`${API_URL}/candidates`, { headers }),
        fetch(`${API_URL}/applications`, { headers }),
      ])

      if (
        !jobsResponse.ok ||
        !candidatesResponse.ok ||
        !applicationsResponse.ok
      ) {
        throw new Error(
          'Unable to load dashboard statistics. Please try refreshing.'
        )
      }

      const [jobsData, candidatesData, applicationsData] =
        await Promise.all([
          jobsResponse.json(),
          candidatesResponse.json(),
          applicationsResponse.json(),
        ])

      const jobs = Array.isArray(jobsData.jobs)
        ? jobsData.jobs
        : []

      const candidates = Array.isArray(candidatesData.candidates)
        ? candidatesData.candidates
        : []

      const applications = Array.isArray(applicationsData.applications)
        ? applicationsData.applications
        : []

      const countStatus = (status) =>
        applications.filter(
          (application) =>
            application.status?.toLowerCase() === status.toLowerCase()
        ).length

      setStats({
        jobs: jobs.length,
        candidates: candidates.length,
        applications: applications.length,
        shortlisted: countStatus('Shortlisted'),
        interviews: countStatus('Interview'),
        hired: countStatus('Hired'),
        rejected: countStatus('Rejected'),
        applied: countStatus('Applied'),
      })

      // Count applications for each job.
      const jobCounts = {}

      applications.forEach((application) => {
        const job = application.job

        if (!job) return

        const jobId =
          typeof job === 'object' ? job._id : job

        if (!jobId) return

        if (!jobCounts[jobId]) {
          jobCounts[jobId] = {
            id: jobId,
            title:
              typeof job === 'object'
                ? job.title || 'Untitled Job'
                : 'Job',
            applications: 0,
            shortlisted: 0,
            hired: 0,
          }
        }

        jobCounts[jobId].applications += 1

        if (
          application.status?.toLowerCase() === 'shortlisted'
        ) {
          jobCounts[jobId].shortlisted += 1
        }

        if (application.status?.toLowerCase() === 'hired') {
          jobCounts[jobId].hired += 1
        }
      })

      setJobAnalytics(
        Object.values(jobCounts).sort(
          (a, b) => b.applications - a.applications
        )
      )
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong while loading dashboard data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const totalApplications = stats.applications

  const getPercentage = (count) => {
    if (totalApplications === 0) return 0

    return Math.round((count / totalApplications) * 100)
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.jobs,
      description: 'Recruitment opportunities',
      color: 'primary',
      icon: '💼',
      iconBackground: '#e8efff',
    },
    {
      title: 'Total Candidates',
      value: stats.candidates,
      description: 'Available candidate records',
      color: 'info',
      icon: '👥',
      iconBackground: '#e5f8fc',
    },
    {
      title: 'Total Applications',
      value: stats.applications,
      description: 'Applications received',
      color: 'secondary',
      icon: '📄',
      iconBackground: '#f0ebf8',
    },
    {
      title: 'Shortlisted',
      value: stats.shortlisted,
      description: 'Candidates shortlisted',
      color: 'primary',
      icon: '⭐',
      iconBackground: '#e8efff',
    },
    {
      title: 'Interviews',
      value: stats.interviews,
      description: 'Applications at interview stage',
      color: 'warning',
      icon: '🎯',
      iconBackground: '#fff4db',
    },
    {
      title: 'Hired',
      value: stats.hired,
      description: 'Successful applications',
      color: 'success',
      icon: '✅',
      iconBackground: '#e5f7ec',
    },
  ]

  const statusCards = [
    {
      title: 'Applied',
      count: stats.applied,
      color: 'secondary',
    },
    {
      title: 'Shortlisted',
      count: stats.shortlisted,
      color: 'primary',
    },
    {
      title: 'Interview',
      count: stats.interviews,
      color: 'warning',
    },
    {
      title: 'Hired',
      count: stats.hired,
      color: 'success',
    },
    {
      title: 'Rejected',
      count: stats.rejected,
      color: 'danger',
    },
  ]

  const managementCards = [
    {
      title: 'Jobs',
      description:
        'Create, view, and manage recruitment jobs.',
      buttonText: 'Manage Jobs',
      route: '/jobs',
      icon: '💼',
      color: 'primary',
    },
    {
      title: 'Candidates',
      description:
        'Explore candidate profiles, skills, and resume information.',
      buttonText: 'View Candidates',
      route: '/candidates',
      icon: '👥',
      color: 'info',
    },
    {
      title: 'Applications',
      description:
        'Review applications and track recruitment progress.',
      buttonText: 'View Applications',
      route: '/applications',
      icon: '📋',
      color: 'success',
    },
  ]

  return (
    <div className="container-fluid px-3 px-md-4 px-xl-5 py-4 py-lg-5">
      <div className="mx-auto" style={{ maxWidth: '1500px' }}>
        {/* Dashboard Header */}
        <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2"
                style={{ fontSize: '0.75rem' }}
              >
                RECRUITMENT WORKSPACE
              </span>
            </div>

            <h1
              className="fw-bold mb-2"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                letterSpacing: '-0.8px',
                color: '#172554',
              }}
            >
              Dashboard
            </h1>

            <p className="text-secondary mb-0">
              Monitor recruitment performance and manage your hiring
              activities from one place.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary px-3 py-2"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Refreshing...
                </>
              ) : (
                <>↻ Refresh Data</>
              )}
            </button>

            <button
              className="btn btn-outline-danger px-3 py-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* User Welcome Panel */}
        <section
          className="card border-0 shadow-sm mb-5 overflow-hidden"
          style={{
            borderRadius: '16px',
            background:
              'linear-gradient(120deg, #eff6ff 0%, #ffffff 65%, #f0f9ff 100%)',
          }}
        >
          <div className="card-body p-4 p-lg-5">
            <div className="row align-items-center g-4">
              <div className="col-12 col-lg-8">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-4 bg-primary text-white flex-shrink-0"
                    style={{
                      width: '58px',
                      height: '58px',
                      fontSize: '1.6rem',
                      fontWeight: '700',
                    }}
                    aria-hidden="true"
                  >
                    {(user?.name || 'R').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="text-primary fw-semibold mb-1">
                      Welcome back
                    </p>

                    <h2
                      className="fw-bold mb-0"
                      style={{
                        fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                        color: '#172554',
                      }}
                    >
                      {user?.name || 'Recruiter'}
                    </h2>
                  </div>
                </div>

                <p
                  className="text-secondary mb-0"
                  style={{ maxWidth: '650px', lineHeight: '1.7' }}
                >
                  Here is your recruitment overview. Review your hiring
                  progress, track applications, and access your recruitment
                  tools.
                </p>
              </div>

              <div className="col-12 col-lg-4">
                <div
                  className="bg-white border rounded-3 p-3"
                  style={{ borderColor: '#dbeafe' }}
                >
                  <div className="mb-3">
                    <div
                      className="text-secondary mb-1"
                      style={{ fontSize: '0.8rem' }}
                    >
                      ACCOUNT EMAIL
                    </div>

                    <div
                      className="fw-semibold text-break"
                      style={{ color: '#1e293b' }}
                    >
                      {user?.email || 'Not available'}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <span
                      className="text-secondary"
                      style={{ fontSize: '0.8rem' }}
                    >
                      ACCOUNT ROLE
                    </span>

                    <span className="badge bg-primary-subtle text-primary px-3 py-2">
                      {user?.role || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div
            className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4"
            role="alert"
          >
            <span>{error}</span>

            <button
              className="btn btn-sm btn-outline-danger flex-shrink-0"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recruitment Statistics */}
        <section className="mb-5">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-end gap-2 mb-3">
            <div>
              <h3
                className="fw-bold mb-1"
                style={{ color: '#172554' }}
              >
                Recruitment Statistics
              </h3>

              <p className="text-secondary mb-0">
                A quick overview of your recruitment activity.
              </p>
            </div>

            {!loading && !error && (
              <span className="badge bg-light text-secondary border px-3 py-2">
                Live dashboard data
              </span>
            )}
          </div>

          {loading ? (
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: '14px' }}
            >
              <div className="card-body text-center py-5">
                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <p className="fw-semibold mb-1">
                  Loading recruitment statistics
                </p>

                <p className="text-secondary small mb-0">
                  Please wait while we retrieve your dashboard data.
                </p>
              </div>
            </div>
          ) : !error ? (
            <div className="row g-3">
              {statCards.map((card) => (
                <div
                  className="col-12 col-sm-6 col-xl-4"
                  key={card.title}
                >
                  <div
                    className="card h-100 border-0 shadow-sm"
                    style={{
                      borderRadius: '14px',
                      transition:
                        'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform =
                        'translateY(-3px)'
                      event.currentTarget.style.boxShadow =
                        '0 10px 25px rgba(15, 23, 42, 0.09)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform =
                        'translateY(0)'
                      event.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div className="flex-grow-1">
                          <p
                            className="text-secondary fw-medium mb-2"
                            style={{ fontSize: '0.9rem' }}
                          >
                            {card.title}
                          </p>

                          <h2
                            className="fw-bold mb-2"
                            style={{
                              fontSize: '2.2rem',
                              color: '#172554',
                              lineHeight: '1.1',
                            }}
                          >
                            {card.value.toLocaleString()}
                          </h2>

                          <p
                            className="text-secondary small mb-0"
                            style={{ lineHeight: '1.5' }}
                          >
                            {card.description}
                          </p>
                        </div>

                        <div
                          className="d-flex align-items-center justify-content-center rounded-4 flex-shrink-0"
                          style={{
                            width: '54px',
                            height: '54px',
                            backgroundColor: card.iconBackground,
                            fontSize: '1.55rem',
                          }}
                          aria-hidden="true"
                        >
                          {card.icon}
                        </div>
                      </div>

                      <div
                        className={`mt-4 rounded-pill bg-${card.color}`}
                        style={{
                          width: '42px',
                          height: '4px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-4">
                <p className="text-secondary mb-0">
                  Statistics could not be loaded. Please try again.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Application Status Analytics */}
        {!loading && !error && (
          <section className="mb-5">
            <div className="mb-3">
              <h3
                className="fw-bold mb-1"
                style={{ color: '#172554' }}
              >
                Application Status Breakdown
              </h3>

              <p className="text-secondary mb-0">
                Understand how applications are progressing through your
                recruitment pipeline.
              </p>
            </div>

            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: '14px' }}
            >
              <div className="card-body p-4 p-lg-5">
                {statusCards.map((status) => {
                  const percentage = getPercentage(status.count)

                  return (
                    <div
                      className="mb-4"
                      key={status.title}
                    >
                      <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`rounded-circle bg-${status.color}`}
                            style={{
                              width: '9px',
                              height: '9px',
                              display: 'inline-block',
                            }}
                            aria-hidden="true"
                          />

                          <span className="fw-semibold">
                            {status.title}
                          </span>
                        </div>

                        <div className="text-end">
                          <span className="fw-bold">
                            {status.count}
                          </span>

                          <span className="text-secondary small ms-2">
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      <div
                        className="progress"
                        style={{
                          height: '10px',
                          borderRadius: '20px',
                          backgroundColor: '#eef2f7',
                        }}
                        role="progressbar"
                        aria-label={`${status.title} applications`}
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <div
                          className={`progress-bar bg-${status.color}`}
                          style={{
                            width: `${percentage}%`,
                            borderRadius: '20px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {totalApplications === 0 && (
                  <div className="text-center border-top pt-4 mt-2">
                    <div className="fs-2 mb-2" aria-hidden="true">
                      📊
                    </div>

                    <p className="fw-semibold mb-1">
                      No application data yet
                    </p>

                    <p className="text-secondary small mb-0">
                      Application status analytics will appear here when
                      candidates start applying.
                    </p>
                  </div>
                )}

                {totalApplications > 0 && (
                  <div className="border-top pt-3 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">
                        Total applications tracked
                      </span>

                      <span className="fw-bold">
                        {totalApplications.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Job-wise Analytics */}
        {!loading && !error && (
          <section className="mb-5">
            <div className="mb-3">
              <h3
                className="fw-bold mb-1"
                style={{ color: '#172554' }}
              >
                Job-wise Application Analytics
              </h3>

              <p className="text-secondary mb-0">
                Compare application activity and hiring outcomes across jobs.
              </p>
            </div>

            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: '14px' }}
            >
              {jobAnalytics.length === 0 ? (
                <div className="card-body text-center py-5">
                  <div className="fs-1 mb-2" aria-hidden="true">
                    📂
                  </div>

                  <h5 className="fw-bold mb-2">
                    No job applications yet
                  </h5>

                  <p className="text-secondary mb-3">
                    Once applications are received, job-wise analytics
                    will be displayed here.
                  </p>

                  <button
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/jobs')}
                  >
                    View Jobs
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr className="table-light">
                        <th className="py-3 px-4">
                          Job Title
                        </th>

                        <th className="py-3">
                          Total Applications
                        </th>

                        <th className="py-3">
                          Shortlisted
                        </th>

                        <th className="py-3 pe-4">
                          Hired
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {jobAnalytics.map((job) => (
                        <tr key={job.id}>
                          <td className="px-4 py-3">
                            <div className="fw-semibold text-dark">
                              {job.title}
                            </div>
                          </td>

                          <td className="py-3">
                            <span className="fw-semibold">
                              {job.applications}
                            </span>
                          </td>

                          <td className="py-3">
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                              {job.shortlisted}
                            </span>
                          </td>

                          <td className="py-3 pe-4">
                            <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                              {job.hired}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recruitment Management */}
        <section className="mb-4">
          <div className="mb-3">
            <h3
              className="fw-bold mb-1"
              style={{ color: '#172554' }}
            >
              Recruitment Management
            </h3>

            <p className="text-secondary mb-0">
              Access your recruitment tools and manage each stage of hiring.
            </p>
          </div>

          <div className="row g-3">
            {/* Jobs, Candidates, Applications */}
            {managementCards.map((card) => (
              <div
                className="col-12 col-md-6 col-xl-4"
                key={card.title}
              >
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    borderRadius: '14px',
                    transition:
                      'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform =
                      'translateY(-3px)'
                    event.currentTarget.style.boxShadow =
                      '0 10px 25px rgba(15, 23, 42, 0.09)'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform =
                      'translateY(0)'
                    event.currentTarget.style.boxShadow = ''
                  }}
                >
                  <div className="card-body p-4 d-flex flex-column">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-4 mb-3"
                      style={{
                        width: '52px',
                        height: '52px',
                        backgroundColor:
                          card.color === 'primary'
                            ? '#e8efff'
                            : card.color === 'info'
                              ? '#e5f8fc'
                              : '#e5f7ec',
                        fontSize: '1.5rem',
                      }}
                      aria-hidden="true"
                    >
                      {card.icon}
                    </div>

                    <h5 className="fw-bold mb-2">
                      {card.title}
                    </h5>

                    <p
                      className="text-secondary mb-4"
                      style={{ lineHeight: '1.7' }}
                    >
                      {card.description}
                    </p>

                    <button
                      className={`btn btn-${card.color} mt-auto align-self-start px-3`}
                      onClick={() => navigate(card.route)}
                    >
                      {card.buttonText} →
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Recruitment Recommendations */}
            <div className="col-12 col-xl-6">
              <div
                className="card h-100 border-0 shadow-sm overflow-hidden"
                style={{
                  borderRadius: '14px',
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #f1f5ff 100%)',
                }}
              >
                <div
                  style={{
                    height: '4px',
                    background:
                      'linear-gradient(90deg, #0d6efd, #7c83ff)',
                  }}
                />

                <div className="card-body p-4">
                  <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mb-3">
                    ✨ AI POWERED
                  </span>

                  <h5 className="fw-bold mb-2">
                    AI Recruitment Recommendations
                  </h5>

                  <p
                    className="text-secondary mb-4"
                    style={{ lineHeight: '1.7' }}
                  >
                    Generate recruitment summaries, review candidate
                    priorities, identify skills to verify, and prepare
                    interview questions using AI.
                  </p>

                  <button
                    className="btn btn-primary px-3"
                    onClick={() =>
                      navigate('/recruitment-recommendations')
                    }
                  >
                    Generate Recommendations →
                  </button>
                </div>
              </div>
            </div>

            {/* AI Recruitment Automation Agent */}
            <div className="col-12 col-xl-6">
              <div
                className="card h-100 border-0 shadow-sm overflow-hidden"
                style={{
                  borderRadius: '14px',
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
                }}
              >
                <div
                  style={{
                    height: '4px',
                    background:
                      'linear-gradient(90deg, #198754, #20c997)',
                  }}
                />

                <div className="card-body p-4">
                  <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 mb-3">
                    🤖 AI AGENT
                  </span>

                  <h5 className="fw-bold mb-2">
                    AI Recruitment Automation Agent
                  </h5>

                  <p
                    className="text-secondary mb-4"
                    style={{ lineHeight: '1.7' }}
                  >
                    Analyze candidates for a selected job, identify
                    eligible applicants, rank candidate matches, and
                    generate AI-powered recruitment recommendations
                    and interview questions.
                  </p>

                  <button
                    className="btn btn-success px-3"
                    onClick={() => navigate('/recruitment-agent')}
                  >
                    Run Recruitment Agent →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-top pt-3 mt-5">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <p className="text-secondary small mb-0">
              Smart Recruitment Recommendation Platform
            </p>

            <p className="text-secondary small mb-0">
              Recruitment overview and analytics
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Dashboard