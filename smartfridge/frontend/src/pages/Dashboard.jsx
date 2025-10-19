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
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-400 bg-[length:200%_auto] motion-safe:animate-gradient-x drop-shadow-[0_0_8px_rgba(99,102,241,0.35)]">概览</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>临期范围(天)</span>
          <input type="number" min="1" className="w-20 border rounded px-2 py-1" value={days}
            onChange={(e)=>setDays(Number(e.target.value))} />
          <button className="relative overflow-hidden px-3 py-1 bg-gray-900 text-white rounded" onClick={()=>load(days)}>
            <span className="relative z-10">刷新</span>
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      ) : error ? <p className="text-red-600">{error}</p> : (
        <div className="grid md:grid-cols-3 gap-6">
          <section className="bg-white rounded shadow transition-all hover:shadow-lg motion-safe:animate-fade-in-up">
            <div className="px-4 py-3 border-b font-medium">低库存（{data.low_stock?.length || 0}）</div>
            <ul className="divide-y">
              {(data.low_stock || []).map(it => (
                <li key={it.id} className="px-4 py-3 text-sm flex justify-between">
                  <span>{it.name}</span>
                  <span className="text-gray-600">{it.quantity}{it.unit} / 最低 {it.min_stock}{it.unit}</span>
                </li>
              ))}
              {(!data.low_stock || data.low_stock.length === 0) && <li className="px-4 py-3 text-gray-500 text-sm">暂无</li>}
            </ul>
            <div className="px-4 py-3 border-t text-right text-sm">
              <Link to="/inventory" className="underline">去库存列表</Link>
            </div>
          </section>

          <section className="bg-white rounded shadow transition-all hover:shadow-lg motion-safe:animate-fade-in-up">
            <div className="px-4 py-3 border-b font-medium">临期（≤{data.days} 天，{data.near_expiry?.length || 0}）</div>
            <ul className="divide-y">
              {(data.near_expiry || []).map(it => (
                <li key={it.id} className="px-4 py-3 text-sm flex justify-between">
                  <span>{it.name}</span>
                  <span className="text-gray-600">到期 {it.expiry_date || '未知'}</span>
                </li>
              ))}
              {(!data.near_expiry || data.near_expiry.length === 0) && <li className="px-4 py-3 text-gray-500 text-sm">暂无</li>}
            </ul>
            <div className="px-4 py-3 border-t text-right text-sm">
              <Link to="/inventory" className="underline">去库存列表</Link>
            </div>
          </section>

          <section className="bg-white rounded shadow transition-all hover:shadow-lg motion-safe:animate-fade-in-up">
            <div className="px-4 py-3 border-b font-medium">优先消耗（Top {data.priority?.length || 0}）</div>
            <ul className="divide-y">
              {(data.priority || []).map((p, i) => (
                <li key={i} className="px-4 py-3 text-sm flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-gray-600">
                    {p.days_to_expiry != null ? `D-${p.days_to_expiry}` : ''}
                    {p.days_to_empty != null ? `${p.days_to_expiry != null ? ' · ' : ''}空${p.days_to_empty}天` : ''}
                  </span>
                </li>
              ))}
              {(!data.priority || data.priority.length === 0) && <li className="px-4 py-3 text-gray-500 text-sm">暂无</li>}
            </ul>
            <div className="px-4 py-3 border-t text-right text-sm">
              <Link to="/inventory" className="underline">去库存列表</Link>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
