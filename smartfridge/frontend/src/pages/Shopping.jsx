import { useEffect, useState } from 'react'
import api from '../lib/apiClient.js'
import Modal from '../components/Modal.jsx'
import { SkeletonLine } from '../components/Skeleton.jsx'

export default function Shopping() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openNew, setOpenNew] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: 1, unit: 'pcs' })
  const [openBatch, setOpenBatch] = useState(false)
  const [batchRows, setBatchRows] = useState([])
  const [source, setSource] = useState('')
  const [groupBy, setGroupBy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/inventory/shopping/', { params: { status: 'pending', source: source || undefined } })
      setItems(data)
      setError(null)
    } catch (e) { setError('Load failed') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [source])

  const openBatchModal = () => {
    const rows = items.map(it => ({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit, expiry_date: '' }))
    setBatchRows(rows)
    setOpenBatch(true)
  }

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="flex items-center gap-2 mb-4">
        <button className="btn-ghost" onClick={async()=>{ await api.post('/api/v1/inventory/shopping/generate/'); load() }}>Generate from Low Stock</button>
        <button className="btn-ghost" onClick={()=>setOpenNew(true)}>New</button>
        <button className="btn-primary" onClick={openBatchModal}>Stock-in All</button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>Source:</span>
          {['', 'manual', 'low_stock', 'ai', 'plan'].map(s => (
            <button
              key={s || 'all'}
              className={`px-3 py-1 rounded-full transition-all ring-1 ring-black/5 ${source===s? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white shadow' : 'bg-white/70 hover:bg-white'}`}
              onClick={()=>setSource(s)}
            >
              {s || 'All'}
            </button>
          ))}
          <label className="ml-3 flex items-center gap-1"><input type="checkbox" checked={groupBy} onChange={e=>setGroupBy(e.target.checked)} />Group by category</label>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded shadow">
              <SkeletonLine className="h-5 w-48 mb-2" />
              <SkeletonLine className="h-4 w-72" />
            </div>
          ))}
        </div>
      ) : error ? <p className="text-red-600">{error}</p> : (
        groupBy ? (
          <div className="space-y-4">
            {Object.entries(items.reduce((acc, t)=>{
              const key = t.item_category || 'Uncategorized'
              acc[key] = acc[key] || []
              acc[key].push(t)
              return acc
            }, {})).map(([cat, rows]) => (
              <div key={cat} className="glass-card rounded-2xl transition-all hover:shadow-xl">
                <div className="px-5 py-3 border-b font-heading font-semibold">{cat} ({rows.length})</div>
                <div className="divide-y">
                  {rows.map(t => (
                    <div key={t.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/60 transition">
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2"><span>{t.name}</span><SourceBadge s={t.source} /></div>
                        <div className="text-gray-600">{t.quantity}{t.unit}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-soft" onClick={async()=>{ await api.post(`/api/v1/inventory/shopping/${t.id}/purchase/`, {}); load() }}>Stock-in</button>
                        <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.patch(`/api/v1/inventory/shopping/${t.id}/`, { status: 'done' }); load() }}>Done</button>
                        <button className="px-2 py-1 bg-gray-50 text-gray-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/shopping/${t.id}/`); load() }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl divide-y transition-all hover:shadow-xl">
            {items.length === 0 && <p className="p-4 text-gray-500">No items</p>}
            {items.map(t => (
              <div
                key={t.id}
                className={
                  `px-5 py-4 flex items-center justify-between motion-safe:animate-fade-in-up hover:bg-white/60 transition ` +
                  (t.source === 'ai' ? 'ring-1 ring-sky-200 rounded bg-sky-50/40 ' : '')
                }
              >
                <div className="text-sm">
                  <div className="font-medium flex items-center gap-2"><span>{t.name}</span><SourceBadge s={t.source} /></div>
                  <div className="text-gray-600">{t.quantity}{t.unit}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-soft" onClick={async()=>{ await api.post(`/api/v1/inventory/shopping/${t.id}/purchase/`, {}); load() }}>Stock-in</button>
                  <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.patch(`/api/v1/inventory/shopping/${t.id}/`, { status: 'done' }); load() }}>Done</button>
                  <button className="px-2 py-1 bg-gray-50 text-gray-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/shopping/${t.id}/`); load() }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal
        open={openNew}
        title="New Shopping Task"
        onClose={()=>setOpenNew(false)}
        actions={<button className="btn-primary" onClick={async()=>{
          try { await api.post('/api/v1/inventory/shopping/', form); setOpenNew(false); setForm({ name: '', quantity: 1, unit: 'pcs' }); load(); } catch(e){ alert('Create failed') }
        }}>Save</button>}
      >
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-3">Name<input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></label>
          <label>Qty<input type="number" step="0.01" className="input" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} /></label>
          <label>Unit<input className="input" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} /></label>
        </div>
      </Modal>

      {/* Batch stock-in modal */}
      <Modal
        open={openBatch}
        title="Batch Stock-in"
        onClose={()=>setOpenBatch(false)}
        actions={<button className="btn-primary" onClick={async()=>{
          try {
            const payload = { items: batchRows.map(r=>({ id: r.id, quantity: r.quantity, expiry_date: r.expiry_date })) }
            await api.post('/api/v1/inventory/shopping/purchase-batch/', payload)
            setOpenBatch(false)
            load()
          } catch(e) { alert('Stock-in failed') }
        }}>Stock-in</button>}
      >
        <div className="max-h-96 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((r, idx)=>(
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2"><input type="number" step="0.01" className="w-28 input" value={r.quantity}
                    onChange={e=>{ const a=[...batchRows]; a[idx]={...a[idx], quantity:e.target.value}; setBatchRows(a) }} /></td>
                  <td className="p-2"><input type="date" className="w-44 input" value={r.expiry_date||''}
                    onChange={e=>{ const a=[...batchRows]; a[idx]={...a[idx], expiry_date:e.target.value}; setBatchRows(a) }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* AI Assistant (restock/add/stock-in) */}
      <AssistantChat onDone={load} />
    </div>
  )
}

function AssistantChat({ onDone }) {
  const [history, setHistory] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text }
    setHistory(h => [...h, userMsg])
    setLoading(true)
    try {
      const { data } = await api.post('/api/v1/ai/assistant/', { message: text, execute: true, language: 'zh' })
      const d = data?.decision || {}
      const r = data?.result || {}
      const reason = d?.reason ? `; reason: ${d.reason}` : ''
      const summary = `Action: ${d.action || 'unknown'}; added to list: ${r.created_shopping || 0}; direct stock-in: ${r.imported || 0}${reason}`
      setHistory(h => [...h, { role: 'assistant', text: summary }])
      onDone?.()
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', text: (e?.response?.data?.detail || 'Failed to execute') }])
    } finally {
      setLoading(false)
      setText('')
    }
  }

  return (
    <div className="mt-6 glass-card rounded-2xl">
      <div className="px-5 py-3 border-b font-heading font-semibold">AI Assistant</div>
      <div className="p-4 space-y-2 max-h-64 overflow-auto text-sm">
        {history.length === 0 && <div className="text-gray-500">Examples: "Suggest basics for next week", "Add 12 eggs and 2L milk to shopping list", "Stock in 2 chicken breasts now".</div>}
        {history.map((m, i) => (
          <div key={i} className={m.role==='user'? 'text-right' : ''}>
            <span className={m.role==='user'? 'inline-block px-2 py-1 rounded bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white' : 'inline-block bg-gray-100 px-2 py-1 rounded'}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input className="flex-1 input" placeholder="Tell me: suggest restock / add to list / stock-in..." value={text} onChange={e=>setText(e.target.value)} />
        <button className="relative overflow-hidden btn-primary" disabled={loading} onClick={send}>
          <span className="relative z-10">{loading? 'Running...' : 'Send'}</span>
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
        </button>
      </div>
    </div>
  )
}

function SourceBadge({ s }) {
  const map = {
    ai: 'bg-sky-50 text-sky-700 ring-sky-200',
    low_stock: 'bg-amber-50 text-amber-700 ring-amber-200',
    plan: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    manual: 'bg-gray-100 text-gray-700 ring-gray-200',
  }
  const cls = map[s] || map.manual
  const label = s === '' || !s ? 'manual' : s
  return <span className={`text-[11px] px-1.5 py-0.5 rounded-full ring-1 ${cls}`}>{label}</span>
}
