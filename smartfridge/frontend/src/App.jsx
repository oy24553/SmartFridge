import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Inventory from './pages/Inventory.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Shopping from './pages/Shopping.jsx'
import Planner from './pages/Planner.jsx'
import NavBar from './components/NavBar.jsx'
import { useEffect } from 'react'
import useUI from './lib/ui.js'
import useAuth from './lib/auth.js'
import TechParticles from './components/TechParticles.jsx'

function Protected({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { animEnabled } = useUI()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-anim', animEnabled ? 'on' : 'off')
    }
  }, [animEnabled])

  return (
    <div className="app-shell">
      <div className="fixed inset-0 -z-10 bg-tech">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <TechParticles enabled={animEnabled} />
      </div>
      <NavBar />
      <div className="px-4 md:px-6 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
          <Route path="/shopping" element={<Protected><Shopping /></Protected>} />
          <Route path="/planner" element={<Protected><Planner /></Protected>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
