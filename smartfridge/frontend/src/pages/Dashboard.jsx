import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/apiClient.js'
import { SkeletonCard } from '../components/Skeleton.jsx'
import { daysUntilUK, formatUKDate } from '../lib/ukDate.js'

export default function Dashboard() {
  const [data, setData] = useState({ low_stock: [], near_expiry: [], priority: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/inventory/summary/')
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
    return daysUntilUK(iso)
  }

  const badgeClass = (d) => {
    if (d == null) return 'bg-white/5 text-slate-300 ring-1 ring-white/10'
    if (d <= 0) return 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/20'
    if (d <= 2) return 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20'
    return 'bg-indigo-500/10 text-indigo-200 ring-1 ring-indigo-500/20'
  }

  const useByDays = data?.expiry_thresholds?.use_by_days ?? 2
  const bestBeforeDays = data?.expiry_thresholds?.best_before_days ?? 5

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-[1120px] flex items-center gap-2">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-100">Overview</h1>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-slate-300">Near-expiry: Use by ≤{useByDays}d / Best before ≤{bestBeforeDays}d</span>
          <button className="btn-primary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto w-full max-w-[1120px] grid md:grid-cols-3 gap-6 justify-center">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      ) : error ? <p className="text-rose-300">{error}</p> : (
        <div className="mx-auto w-full max-w-[1120px] grid md:grid-cols-3 gap-6 justify-center">
          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b border-white/10 font-heading font-semibold">Low Stock ({data.low_stock?.length || 0})</div>
            <ul className="divide-y divide-white/10">
              {(data.low_stock || []).map(it => (
                <li key={it.id} className="px-6 py-3.5 text-sm flex items-center gap-4 hover:bg-white/5 transition">
                  <span className="font-medium text-slate-100 min-w-[88px]">{it.name}</span>
                  <div className="hidden sm:block grow">
                    {(() => {
                      const q = Number(it.quantity || 0)
                      const m = Number(it.min_stock || 0)
                      const pct = Math.max(0, Math.min(100, m > 0 ? (q / m) * 100 : 0))
                      return (
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                          <div className="h-full bg-indigo-400/70" style={{ width: `${pct}%` }} />
                        </div>
                      )
                    })()}
                  </div>
                  <span className="text-slate-300 whitespace-nowrap">{it.quantity}{it.unit} / min {it.min_stock}{it.unit}</span>
                </li>
              ))}
              {(!data.low_stock || data.low_stock.length === 0) && <li className="px-6 py-3.5 text-slate-400 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t border-white/10 text-right text-sm">
              <Link to="/inventory" className="text-slate-200 hover:text-white underline underline-offset-4">Open inventory</Link>
            </div>
          </section>

          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b border-white/10 font-heading font-semibold">Near Expiry ({data.near_expiry?.length || 0})</div>
            <ul className="divide-y divide-white/10">
              {(data.near_expiry || []).map(it => (
                <li key={it.id} className="px-6 py-3.5 text-sm flex items-center justify-between hover:bg-white/5 transition">
                  <span className="font-medium text-slate-100">{it.name}</span>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const d = daysTo(it.expiry_date)
                      return <span className={`px-2 py-0.5 rounded-full text-xs ${badgeClass(d)}`}>{d != null ? (d >= 0 ? `D-${d}` : `Expired ${-d}d`) : 'Unknown date'}</span>
                    })()}
                    <span className="text-slate-300 hidden sm:inline">
                      {(it.expiry_type === 'use_by' ? 'Use by' : 'Best before')}{it.expiry_date ? `: ${formatUKDate(it.expiry_date)}` : ''}
                    </span>
                </div>
              </li>
              ))}
              {(!data.near_expiry || data.near_expiry.length === 0) && <li className="px-6 py-3.5 text-slate-400 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t border-white/10 text-right text-sm">
              <Link to="/inventory" className="text-slate-200 hover:text-white underline underline-offset-4">Open inventory</Link>
            </div>
          </section>

          <section className="glass-card transition-all hover:shadow-xl hover:-translate-y-0.5 motion-safe:animate-fade-in-up rounded-2xl">
            <div className="px-6 py-3.5 border-b border-white/10 font-heading font-semibold">Priority to Consume (Top {data.priority?.length || 0})</div>
            <ul className="divide-y divide-white/10">
              {(data.priority || []).map((p, i) => (
                <li key={i} className="px-6 py-3.5 text-sm flex items-center justify-between hover:bg-white/5 transition">
                  <span className="font-medium text-slate-100">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.days_to_expiry != null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${badgeClass(p.days_to_expiry)}`}>D-{p.days_to_expiry}</span>
                    )}
                    {p.days_to_empty != null && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20">Empty in {Math.round(p.days_to_empty)}d</span>
                    )}
                  </div>
                </li>
              ))}
              {(!data.priority || data.priority.length === 0) && <li className="px-6 py-3.5 text-slate-400 text-sm">None</li>}
            </ul>
            <div className="px-6 py-3.5 border-t border-white/10 text-right text-sm">
              <Link to="/inventory" className="text-slate-200 hover:text-white underline underline-offset-4">Open inventory</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
