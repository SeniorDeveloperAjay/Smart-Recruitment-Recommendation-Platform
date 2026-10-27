import { useState } from 'react'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('candidate')
  const [message, setMessage] = useState('')

  const handleRegister = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        setMessage('Registration successful!')
      } else {
        setMessage(data.message)
      }
    } catch (error) {
      setMessage('Unable to connect to backend')
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">

              <h2 className="text-center mb-4">
                Create Account
              </h2>

              <form onSubmit={handleRegister}>

                <div className="mb-3">
                  <label className="form-label">
                    Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Account Type
                  </label>

                  <select
                    className="form-select"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="candidate">
                      Candidate
                    </option>

                    <option value="recruiter">
                      Recruiter
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                >
                  Register
                </button>

              </form>

              {message && (
                <div className="alert alert-info mt-3">
                  {message}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register