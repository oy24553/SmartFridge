import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth, { logout } from '../lib/auth.js'

export default function NavBar() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto container-narrow px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-400 bg-[length:200%_auto] motion-safe:animate-gradient-x drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]"
        >
          SmartPantry
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className={pathname==='/dashboard'?'font-semibold underline':''}>概览</Link>
              <Link to="/inventory" className={pathname==='/inventory'?'font-semibold underline':''}>库存</Link>
              <Link to="/shopping" className={pathname==='/shopping'?'font-semibold underline':''}>购物清单</Link>
              <Link to="/planner" className={pathname==='/planner'?'font-semibold underline':''}>AI 菜单</Link>
            </>
          )}
        </div>
        <div className="space-x-3">
          {isAuthenticated ? (
            <button className="px-3 py-1 rounded bg-gray-100" onClick={handleLogout}>退出</button>
          ) : (
            <Link to="/login" className="px-3 py-1 rounded bg-gray-100">登录</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
