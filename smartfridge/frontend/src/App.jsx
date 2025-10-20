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
    <div className="min-h-screen">
      {/* Animated background layer */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-aurora bg-[length:200%_200%] motion-safe:animate-gradient-xy" />
        <div className="absolute inset-0 bg-grid" />
        <div className="pointer-events-none">
          <div className="absolute -top-20 -right-10 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl motion-safe:animate-blob" />
          <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl motion-safe:animate-blob" />
        </div>
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
