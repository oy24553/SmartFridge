import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuth, { logout } from '../lib/auth.js'
import useUI from '../lib/ui.js'
import Tilt from './Tilt.jsx'

export default function NavBar() {
  const { isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { animEnabled, toggleAnim } = useUI()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-white/60">
      <div className="mx-auto w-full max-w-[1120px] px-4 md:px-6 py-3 flex items-center justify-between">
        <Tilt maxTilt={28} scale={1.06} expand={200} maxRotateZ={12} maxTranslateZ={14}>
          <Link
            to="/"
            className="font-heading font-extrabold text-2xl md:text-3xl gradient-text bg-[length:200%_auto] motion-safe:animate-gradient-x drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]"
            title="SmartFridge"
          >
            SmartFridge
          </Link>
        </Tilt>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6 text-base md:text-lg">
          {isAuthenticated && (
            <>
              <Tilt maxTilt={16} scale={1.04} expand={160} maxRotateZ={8} maxTranslateZ={10}>
                <NavLink to="/dashboard" className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'relative group transition-colors'}>
                  <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-fuchsia-500 group-hover:to-emerald-500">Overview</span>
                  <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-fuchsia-400 to-emerald-400 group-hover:w-full transition-all"></span>
                </NavLink>
              </Tilt>
              <Tilt maxTilt={16} scale={1.04} expand={160} maxRotateZ={8} maxTranslateZ={10}>
                <NavLink to="/inventory" className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'relative group transition-colors'}>
                  <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-sky-500 group-hover:to-indigo-500">Inventory</span>
                  <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-sky-400 to-indigo-400 group-hover:w-full transition-all"></span>
                </NavLink>
              </Tilt>
              <Tilt maxTilt={16} scale={1.04} expand={160} maxRotateZ={8} maxTranslateZ={10}>
                <NavLink to="/shopping" className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'relative group transition-colors'}>
                  <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-500">Shopping</span>
                  <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-rose-400 to-orange-400 group-hover:w-full transition-all"></span>
                </NavLink>
              </Tilt>
              <Tilt maxTilt={16} scale={1.04} expand={160} maxRotateZ={8} maxTranslateZ={10}>
                <NavLink to="/planner" className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'relative group transition-colors'}>
                  <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-sky-500">AI Planner</span>
                  <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-sky-400 group-hover:w-full transition-all"></span>
                </NavLink>
              </Tilt>
            </>
          )}
        </div>
        <div className="space-x-2 flex items-center">
          <button
            className="hidden md:inline-block btn-ghost text-xs"
            onClick={toggleAnim}
            title="Toggle animations"
          >
            Animations: {animEnabled ? 'On' : 'Off'}
          </button>
          {isAuthenticated ? (
            <button className="btn-soft" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="btn-soft">Login</Link>
          )}
          {/* Mobile menu toggle */}
          {isAuthenticated && (
            <button className="md:hidden btn-ghost" aria-label="Toggle menu" aria-expanded={open}
              onClick={()=>setOpen(v=>!v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Mobile dropdown */}
      {isAuthenticated && (
        <div className={`md:hidden overflow-hidden transition-all ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mx-auto w-full max-w-[1120px] px-4 md:px-6 pb-3 flex flex-col gap-2">
            <NavLink to="/dashboard" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'link-underline'}>Overview</NavLink>
            <NavLink to="/inventory" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'link-underline'}>Inventory</NavLink>
            <NavLink to="/shopping" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'link-underline'}>Shopping</NavLink>
            <NavLink to="/planner" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'font-semibold text-gray-900 ':'text-gray-800 ') + 'link-underline'}>AI Planner</NavLink>
            <button className="btn-ghost w-fit text-xs" onClick={()=>{toggleAnim(); setOpen(false)}}>Animations: {animEnabled ? 'On' : 'Off'}</button>
          </div>
        </div>
      )}
    </nav>
  )
}
