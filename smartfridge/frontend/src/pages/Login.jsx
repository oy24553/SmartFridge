import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import api from '../lib/apiClient.js'
import useAuth, { setTokens } from '../lib/auth.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) return <Navigate to="/" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await api.post('/api/auth/jwt/create/', { username, password })
      setTokens({ access: data.access, refresh: data.refresh })
      navigate('/')
    } catch (err) {
      setError('Login failed. Please check your username and password.')
    }
  }

  const onDemo = async () => {
    setError(null)
    try {
      const { data } = await api.post('/api/auth/demo-token/', {})
      setTokens({ access: data.access, refresh: data.refresh })
      navigate('/')
    } catch (err) {
      setError('Demo login failed')
    }
  }

  return (
    <div className="max-w-sm mx-auto glass-card p-6">
      <h1 className="text-xl font-heading font-semibold mb-4 tracking-tight">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600 font-light">Username</label>
          <input className="input" value={username} onChange={(e)=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600 font-light">Password</label>
          <input type="password" className="input" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="space-y-2">
          <button className="w-full btn-primary">Login</button>
          <button type="button" className="w-full btn-demo" onClick={onDemo}>Login as Demo User</button>
        </div>
      </form>
      <div className="mt-3 text-sm text-gray-600">No account? <Link className="text-black underline" to="/register">Register</Link></div>
    </div>
  )
}
