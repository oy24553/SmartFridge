import { useState, useEffect } from 'react'
import api from '../lib/apiClient.js'
import Reveal from '../components/Reveal.jsx'

export default function Planner() {
  const [days, setDays] = useState(1)
  const [meals, setMeals] = useState(2)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [flash, setFlash] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/v1/ai/menu/', { days, meals_per_day: meals, language: 'en' })
      setData(data)
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to generate')
    } finally { setLoading(false) }
  }

  const addDiffToShopping = async () => {
    if (!data?.shopping_diff?.length) return
    for (const d of data.shopping_diff) {
      await api.post('/api/v1/inventory/shopping/', { name: d.name, quantity: d.quantity || 1, unit: d.unit || 'pcs', source: 'plan' })
    }
    alert('Added to shopping list')
    setFlash(true)
    setTimeout(() => setFlash(false), 700)
  }

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/api/v1/inventory/cook-history/')
      setHistory(data)
    } catch (e) { /* noop */ }
  }

  useEffect(() => { loadHistory() }, [])

  const cookMeal = async (dayNo, meal) => {
    try {
      const title = `Day ${dayNo} - ${meal.name}`
      const items = (meal.ingredients || []).map(i => ({ name: i.name, quantity: i.quantity || 0, unit: i.unit || '' }))
      const res = await api.post('/api/v1/inventory/cook/', { title, items })
      alert(`Deducted ${res.data?.consumed_count || 0} inventory item(s)`) 
      loadHistory()
      setFlash(true)
      setTimeout(() => setFlash(false), 700)
    } catch (e) { alert('Deduction failed') }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-4">
      <div>
        <span
          className="block font-mono text-lg overflow-hidden whitespace-nowrap border-r-2 pr-2 border-indigo-500 motion-safe:animate-typing"
          style={{ '--n': '16ch' }}
        >
          AI Menu Planner
        </span>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm text-slate-300">Days</label>
          <input type="number" min="1" max="7" className="w-24 input" value={days} onChange={e=>setDays(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm text-slate-300">Meals per day</label>
          <input type="number" min="1" max="5" className="w-24 input" value={meals} onChange={e=>setMeals(Number(e.target.value))} />
        </div>
        <button className="relative overflow-hidden btn-primary" onClick={generate} disabled={loading}>
          <span className="relative z-10">{loading? 'Generating...' : 'Generate Plan'}</span>
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
        </button>
        {data?.shopping_diff?.length > 0 && (
          <button className="btn-ghost" onClick={addDiffToShopping}>Add diff to shopping list</button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className={`space-y-4 ${flash ? 'flash-once' : ''}`}>
          {(data.plan || []).map(day => (
            <div key={day.day} className="glass-card rounded-2xl motion-safe:animate-fade-in-up">
              <div className="px-5 py-3 border-b border-white/10 font-medium">Day {day.day}</div>
              <div className="p-5 space-y-3">
                {(day.meals || []).map((m, idx) => (
                  <div key={idx}>
                    <div className="font-medium flex items-center justify-between">
                      <span>{m.name}</span>
                      <button className="btn-soft text-xs" onClick={()=>cookMeal(day.day, m)}>Cook</button>
                    </div>
                    {m.ingredients && <div className="text-sm text-slate-300">Ingredients: {m.ingredients.map(i=>`${i.name}${i.quantity?` ${i.quantity}`:''}${i.unit||''}`).join(', ')}</div>}
                    {m.steps && m.steps.length>0 && <ol className="list-decimal list-inside text-sm text-slate-200">{m.steps.map((s,i)=>(<li key={i}>{s}</li>))}</ol>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {data.shopping_diff && (
            <div className="glass-card rounded-2xl">
              <div className="px-5 py-3 border-b border-white/10 font-medium">To Buy</div>
              <ul className="divide-y divide-white/10">
                {data.shopping_diff.map((d,i)=>(
                  <Reveal key={i}>
                    <li className="px-5 py-2.5 text-sm flex justify-between">
                      <span>{d.name}</span>
                      <span className="text-slate-300">{d.quantity || ''} {d.unit || ''}</span>
                    </li>
                  </Reveal>
                ))}
                {data.shopping_diff.length===0 && <li className="px-4 py-2 text-sm text-slate-400">None</li>}
              </ul>
            </div>
          )}

          <div className="glass-card rounded-2xl">
            <div className="px-5 py-3 border-b border-white/10 font-medium flex items-center justify-between">Cooking History
              <button className="btn-soft text-xs" onClick={loadHistory}>Refresh</button>
            </div>
            <ul className="divide-y divide-white/10">
              {history.length===0 && <li className="px-4 py-2 text-sm text-slate-400">None</li>}
              {history.map(h => (
                <li key={h.id} className="px-5 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{h.title}</div>
                      <div className="text-slate-400 text-xs">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <button className="btn-ghost !px-2 !py-1 text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/10" onClick={async()=>{ await api.delete(`/api/v1/inventory/cook-history/${h.id}/`); loadHistory() }}>Delete</button>
                  </div>
                  {h.items && h.items.length>0 && (
                    <div className="mt-1 text-slate-200">
                      {h.items.map((i,idx)=>(<span key={idx} className="mr-2">{i.name}{i.used?` -${i.used}`:''}{i.unit||''}</span>))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
