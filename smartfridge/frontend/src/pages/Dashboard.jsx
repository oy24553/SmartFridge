import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/apiClient.js'
import { SkeletonCard } from '../components/Skeleton.jsx'

export default function Dashboard() {
  const [days, setDays] = useState(3)
  const [data, setData] = useState({ low_stock: [], near_expiry: [], priority: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (d = days) => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/inventory/summary/', { params: { days: d } })
      setData(data)
      setError(null)
    } catch (e) {
      setError('Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // helpers for UI flair
  const daysTo = (iso) => {
    try {
      const d = new Date(iso)
      const today = new Date()
      const diff = Math.floor((d.setHours(0,0,0,0) - today.setHours(0,0,0,0)) / 86400000)
      return diff
    } catch { return null }
  }

  const badgeClass = (d) => {
    if (d == null) return 'bg-gray-100 text-gray-600'
    if (d <= 0) return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    if (d <= 3) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-[1120px] flex items-center gap-2">
        <h1 className="font-heading text-xl font-extrabold gradient-text bg-[length:200%_auto] motion-safe:animate-gradient-x drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]">Overview</h1>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="font-light">Expiry window (days)</span>
          <input type="number" min="1" className="w-20 input" value={days}
            onChange={(e)=>setDays(Number(e.target.value))} />
          <button className="relative overflow-hidden btn-primary" onClick={()=>load(days)}>
            <span className="relative z-10">Refresh</span>
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto w-full max-w-[1120px] grid md:grid-cols-3 gap-6 justify-center">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      ) : error ? <p className="text-red-600">{error}</p> : (
        <div className="mx-auto w-full max-w-[1120px] grid md:grid-cols-3 gap-6 justify-center">
          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b font-heading font-semibold">Low Stock ({data.low_stock?.length || 0})</div>
            <ul className="divide-y">
              {(data.low_stock || []).map(it => (
                <li key={it.id} className="px-6 py-3.5 text-sm flex items-center gap-4 hover:bg-white/60 transition">
                  <span className="font-medium text-gray-900 min-w-[88px]">{it.name}</span>
                  <div className="hidden sm:block grow">
                    {(() => {
                      const q = Number(it.quantity || 0)
                      const m = Number(it.min_stock || 0)
                      const pct = Math.max(0, Math.min(100, m > 0 ? (q / m) * 100 : 0))
                      return (
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden ring-1 ring-black/5">
                          <div className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400" style={{ width: `${pct}%` }} />
                        </div>
                      )
                    })()}
                  </div>
                  <span className="text-gray-600 whitespace-nowrap">{it.quantity}{it.unit} / min {it.min_stock}{it.unit}</span>
                </li>
              ))}
              {(!data.low_stock || data.low_stock.length === 0) && <li className="px-6 py-3.5 text-gray-500 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t text-right text-sm">
              <Link to="/inventory" className="underline">Open inventory</Link>
            </div>
          </section>

          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b font-heading font-semibold">Near Expiry (≤{data.days} days, {data.near_expiry?.length || 0})</div>
            <ul className="divide-y">
              {(data.near_expiry || []).map(it => (
                <li key={it.id} className="px-6 py-3.5 text-sm flex items-center justify-between hover:bg-white/60 transition">
                  <span className="font-medium text-gray-900">{it.name}</span>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const d = daysTo(it.expiry_date)
                      return <span className={`px-2 py-0.5 rounded-full text-xs ${badgeClass(d)}`}>{d != null ? (d >= 0 ? `D-${d}` : `Expired ${-d}d`) : 'Unknown date'}</span>
                    })()}
                    <span className="text-gray-600 hidden sm:inline">{it.expiry_date || 'Unknown'}</span>
                </div>
              </li>
              ))}
              {(!data.near_expiry || data.near_expiry.length === 0) && <li className="px-6 py-3.5 text-gray-500 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t text-right text-sm">
              <Link to="/inventory" className="underline">Open inventory</Link>
            </div>
          </section>

          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b font-heading font-semibold">Priority to Consume (Top {data.priority?.length || 0})</div>
            <ul className="divide-y">
              {(data.priority || []).map((p, i) => (
                <li key={i} className="px-6 py-3.5 text-sm flex items-center justify-between hover:bg-white/60 transition">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.days_to_expiry != null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${badgeClass(p.days_to_expiry)}`}>D-{p.days_to_expiry}</span>
                    )}
                    {p.days_to_empty != null && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 ring-1 ring-sky-200">Empty in {Math.round(p.days_to_empty)}d</span>
                    )}
                  </div>
                </li>
              ))}
              {(!data.priority || data.priority.length === 0) && <li className="px-6 py-3.5 text-gray-500 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t text-right text-sm">
              <Link to="/inventory" className="underline">Open inventory</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
