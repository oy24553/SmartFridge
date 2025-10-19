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
      setError('登录失败，请检查用户名与密码。')
    }
  }

  return (
    <div className="max-w-sm mx-auto bg-white shadow p-6 rounded">
      <h1 className="text-xl font-semibold mb-4">登录</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">用户名</label>
          <input className="w-full border rounded px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">密码</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-black text-white py-2 rounded">登录</button>
      </form>
      <div className="mt-3 text-sm text-gray-600">没有账号？<Link className="text-black underline" to="/register">注册</Link></div>
    </div>
  )
}
