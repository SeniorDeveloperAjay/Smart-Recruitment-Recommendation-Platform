import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import ProtectedRoute from './components/ProtectedRoute'
import Candidates from './pages/Candidates'
import Applications from './pages/Applications'
import RecruitmentRecommendations from './pages/RecruitmentRecommendations'
import RecruitmentAgent from './pages/RecruitmentAgent'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/candidates"
  element={
    <ProtectedRoute>
      <Candidates />
    </ProtectedRoute>
  }
/>
<Route
  path="/applications"
  element={
    <ProtectedRoute>
      <Applications />
    </ProtectedRoute>
  }
/>
<Route
  path="/recruitment-recommendations"
  element={
    <ProtectedRoute>
      <RecruitmentRecommendations />
    </ProtectedRoute>
  }
/>
<Route
  path="/recruitment-agent"
  element={
    <ProtectedRoute>
      <RecruitmentAgent />
    </ProtectedRoute>
  }
/>

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App