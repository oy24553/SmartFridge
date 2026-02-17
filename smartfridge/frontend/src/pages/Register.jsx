import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import api from '../lib/apiClient.js'
import useAuth, { setTokens } from '../lib/auth.js'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    try {
      const { data } = await api.post('/api/auth/register/', { username, email, password })
      setTokens({ access: data.access, refresh: data.refresh })
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.username?.[0] || 'Registration failed'
      setError(msg)
    }
  }

  return (
    <div className="max-w-sm mx-auto glass-card p-6">
      <h1 className="text-xl font-heading font-semibold mb-4 tracking-tight">Register</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-300">Username</label>
          <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Email (optional)</label>
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Password</label>
          <input type="password" className="input" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Confirm Password</label>
          <input type="password" className="input" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full btn-primary">Register</button>
      </form>
      <div className="mt-3 text-sm text-slate-300">Already have an account? <Link className="text-slate-100 hover:text-white underline underline-offset-4" to="/login">Go to Login</Link></div>
    </div>
  )
}
