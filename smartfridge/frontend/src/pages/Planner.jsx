import { useState, useEffect } from 'react'
import api from '../lib/apiClient.js'

export default function Planner() {
  const [days, setDays] = useState(1)
  const [meals, setMeals] = useState(2)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const generate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/v1/ai/menu/', { days, meals_per_day: meals, language: 'zh' })
      setData(data)
      setError(null)
    } catch (e) {
      setError(e?.response?.data?.detail || '生成失败')
    } finally { setLoading(false) }
  }

  const addDiffToShopping = async () => {
    if (!data?.shopping_diff?.length) return
    for (const d of data.shopping_diff) {
      await api.post('/api/v1/inventory/shopping/', { name: d.name, quantity: d.quantity || 1, unit: d.unit || 'pcs', source: 'plan' })
    }
    alert('已加入购物清单')
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
      const title = `第${dayNo}天 - ${meal.name}`
      const items = (meal.ingredients || []).map(i => ({ name: i.name, quantity: i.quantity || 0, unit: i.unit || '' }))
      const res = await api.post('/api/v1/inventory/cook/', { title, items })
      alert(`已扣减 ${res.data?.consumed_count || 0} 项库存`)
      loadHistory()
    } catch (e) { alert('扣减失败') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm text-gray-600">天数</label>
          <input type="number" min="1" max="7" className="w-24 border rounded px-2 py-1" value={days} onChange={e=>setDays(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm text-gray-600">每天餐数</label>
          <input type="number" min="1" max="5" className="w-24 border rounded px-2 py-1" value={meals} onChange={e=>setMeals(Number(e.target.value))} />
        </div>
        <button className="px-3 py-2 bg-gray-900 text-white rounded" onClick={generate} disabled={loading}>{loading? '生成中...' : '生成菜单'}</button>
        {data?.shopping_diff?.length > 0 && (
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={addDiffToShopping}>将差额加入购物清单</button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-4">
          {(data.plan || []).map(day => (
            <div key={day.day} className="bg-white rounded shadow">
              <div className="px-4 py-2 border-b font-medium">第 {day.day} 天</div>
              <div className="p-4 space-y-3">
                {(day.meals || []).map((m, idx) => (
                  <div key={idx}>
                    <div className="font-medium flex items-center justify-between">
                      <span>{m.name}</span>
                      <button className="px-2 py-1 bg-emerald-600 text-white rounded text-xs" onClick={()=>cookMeal(day.day, m)}>确认做饭</button>
                    </div>
                    {m.ingredients && <div className="text-sm text-gray-600">用料：{m.ingredients.map(i=>`${i.name}${i.quantity?` ${i.quantity}`:''}${i.unit||''}`).join('，')}</div>}
                    {m.steps && m.steps.length>0 && <ol className="list-decimal list-inside text-sm text-gray-700">{m.steps.map((s,i)=>(<li key={i}>{s}</li>))}</ol>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {data.shopping_diff && (
            <div className="bg-white rounded shadow">
              <div className="px-4 py-2 border-b font-medium">需要补购</div>
              <ul className="divide-y">
                {data.shopping_diff.map((d,i)=>(<li key={i} className="px-4 py-2 text-sm flex justify-between"><span>{d.name}</span><span className="text-gray-600">{d.quantity || ''} {d.unit || ''}</span></li>))}
                {data.shopping_diff.length===0 && <li className="px-4 py-2 text-sm text-gray-500">无</li>}
              </ul>
            </div>
          )}

          <div className="bg-white rounded shadow">
            <div className="px-4 py-2 border-b font-medium flex items-center justify-between">做饭历史
              <button className="px-2 py-1 bg-gray-100 rounded text-xs" onClick={loadHistory}>刷新</button>
            </div>
            <ul className="divide-y">
              {history.length===0 && <li className="px-4 py-2 text-sm text-gray-500">暂无</li>}
              {history.map(h => (
                <li key={h.id} className="px-4 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{h.title}</div>
                      <div className="text-gray-500 text-xs">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/cook-history/${h.id}/`); loadHistory() }}>删除</button>
                  </div>
                  {h.items && h.items.length>0 && (
                    <div className="mt-1 text-gray-700">
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
