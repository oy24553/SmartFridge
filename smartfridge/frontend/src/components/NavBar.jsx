import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuth, { logout } from '../lib/auth.js'
import useUI from '../lib/ui.js'

export default function NavBar() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { animEnabled, toggleAnim } = useUI()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="app-container py-3 flex items-center justify-between">
        <Link
          to="/"
          className="font-heading font-semibold text-lg md:text-xl tracking-tight text-slate-100 hover:text-white transition"
          title="SmartFridge"
        >
          SmartFridge<span className="text-indigo-400">.</span>
        </Link>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  (isActive ? 'text-white ' : 'text-slate-300 hover:text-slate-100 ') +
                  'relative py-1 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-indigo-400/80 after:transition-all hover:after:w-full ' +
                  (isActive ? 'after:w-full after:bg-indigo-300' : '')
                }
              >
                Overview
              </NavLink>
              <NavLink
                to="/inventory"
                className={({ isActive }) =>
                  (isActive ? 'text-white ' : 'text-slate-300 hover:text-slate-100 ') +
                  'relative py-1 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-indigo-400/80 after:transition-all hover:after:w-full ' +
                  (isActive ? 'after:w-full after:bg-indigo-300' : '')
                }
              >
                Inventory
              </NavLink>
              <NavLink
                to="/shopping"
                className={({ isActive }) =>
                  (isActive ? 'text-white ' : 'text-slate-300 hover:text-slate-100 ') +
                  'relative py-1 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-indigo-400/80 after:transition-all hover:after:w-full ' +
                  (isActive ? 'after:w-full after:bg-indigo-300' : '')
                }
              >
                Shopping
              </NavLink>
              <NavLink
                to="/planner"
                className={({ isActive }) =>
                  (isActive ? 'text-white ' : 'text-slate-300 hover:text-slate-100 ') +
                  'relative py-1 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-indigo-400/80 after:transition-all hover:after:w-full ' +
                  (isActive ? 'after:w-full after:bg-indigo-300' : '')
                }
              >
                AI Planner
              </NavLink>
            </>
          )}
        </div>
        <div className="space-x-2 flex items-center">
          <button
            className="hidden md:inline-flex btn-ghost text-xs"
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
          <div className="app-container pb-3 flex flex-col gap-2 text-sm">
            <NavLink to="/dashboard" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'text-white':'text-slate-300 hover:text-slate-100') + ' py-1'}>Overview</NavLink>
            <NavLink to="/inventory" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'text-white':'text-slate-300 hover:text-slate-100') + ' py-1'}>Inventory</NavLink>
            <NavLink to="/shopping" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'text-white':'text-slate-300 hover:text-slate-100') + ' py-1'}>Shopping</NavLink>
            <NavLink to="/planner" onClick={()=>setOpen(false)} className={({isActive})=> (isActive?'text-white':'text-slate-300 hover:text-slate-100') + ' py-1'}>AI Planner</NavLink>
            <button className="btn-ghost w-fit text-xs" onClick={()=>{toggleAnim(); setOpen(false)}}>Animations: {animEnabled ? 'On' : 'Off'}</button>
          </div>
        </div>
      )}
    </nav>
  )
}
