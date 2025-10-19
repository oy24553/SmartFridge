import { useEffect, useState } from 'react'
import api from '../lib/apiClient.js'
import Modal from '../components/Modal.jsx'

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
    } catch (e) { setError('加载失败') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { load() }, [source])

  const openBatchModal = () => {
    const rows = items.map(it => ({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit, expiry_date: '' }))
    setBatchRows(rows)
    setOpenBatch(true)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={async()=>{ await api.post('/api/v1/inventory/shopping/generate/'); load() }}>从低库存生成</button>
        <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={()=>setOpenNew(true)}>新增</button>
        <button className="px-3 py-2 bg-gray-900 text-white rounded" onClick={openBatchModal}>一键入库</button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>来源筛选:</span>
          {['', 'manual', 'low_stock', 'ai', 'plan'].map(s => (
            <button key={s || 'all'} className={`px-2 py-1 rounded border ${source===s?'bg-gray-200':''}`} onClick={()=>setSource(s)}>{s || '全部'}</button>
          ))}
          <label className="ml-3 flex items-center gap-1"><input type="checkbox" checked={groupBy} onChange={e=>setGroupBy(e.target.checked)} />按类别分组</label>
          
        </div>
      </div>
      {loading ? <p>加载中...</p> : error ? <p className="text-red-600">{error}</p> : (
        groupBy ? (
          <div className="space-y-4">
            {Object.entries(items.reduce((acc, t)=>{
              const key = t.item_category || '未分类'
              acc[key] = acc[key] || []
              acc[key].push(t)
              return acc
            }, {})).map(([cat, rows]) => (
              <div key={cat} className="bg-white rounded shadow">
                <div className="px-4 py-2 border-b font-medium">{cat}（{rows.length}）</div>
                <div className="divide-y">
                  {rows.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{t.name}</div>
                        <div className="text-gray-600">{t.quantity}{t.unit} · {t.source==='low_stock'?'低库生成': t.source==='ai'?'AI':'手动'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-gray-100 rounded" onClick={async()=>{ await api.post(`/api/v1/inventory/shopping/${t.id}/purchase/`, {}); load() }}>入库</button>
                        <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.patch(`/api/v1/inventory/shopping/${t.id}/`, { status: 'done' }); load() }}>完成</button>
                        <button className="px-2 py-1 bg-gray-50 text-gray-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/shopping/${t.id}/`); load() }}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded shadow divide-y">
            {items.length === 0 && <p className="p-4 text-gray-500">暂无待购项</p>}
            {items.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-gray-600">{t.quantity}{t.unit} · {t.source==='low_stock'?'低库生成': t.source==='ai'?'AI':'手动'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-gray-100 rounded" onClick={async()=>{ await api.post(`/api/v1/inventory/shopping/${t.id}/purchase/`, {}); load() }}>入库</button>
                  <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.patch(`/api/v1/inventory/shopping/${t.id}/`, { status: 'done' }); load() }}>完成</button>
                  <button className="px-2 py-1 bg-gray-50 text-gray-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/shopping/${t.id}/`); load() }}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal
        open={openNew}
        title="新增待购项"
        onClose={()=>setOpenNew(false)}
        actions={<button className="px-3 py-1.5 bg-gray-900 text-white rounded" onClick={async()=>{
          try { await api.post('/api/v1/inventory/shopping/', form); setOpenNew(false); setForm({ name: '', quantity: 1, unit: 'pcs' }); load(); } catch(e){ alert('创建失败') }
        }}>保存</button>}
      >
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-3">名称<input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></label>
          <label>数量<input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} /></label>
          <label>单位<input className="w-full border rounded px-3 py-2" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} /></label>
        </div>
      </Modal>

      {/* 批量入库弹窗 */}
      <Modal
        open={openBatch}
        title="批量入库"
        onClose={()=>setOpenBatch(false)}
        actions={<button className="px-3 py-1.5 bg-gray-900 text-white rounded" onClick={async()=>{
          try {
            const payload = { items: batchRows.map(r=>({ id: r.id, quantity: r.quantity, expiry_date: r.expiry_date })) }
            await api.post('/api/v1/inventory/shopping/purchase-batch/', payload)
            setOpenBatch(false)
            load()
          } catch(e) { alert('入库失败') }
        }}>入库</button>}
      >
        <div className="max-h-96 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">名称</th>
                <th className="p-2">数量</th>
                <th className="p-2">到期日</th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((r, idx)=>(
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2"><input type="number" step="0.01" className="w-28 border rounded px-2 py-1" value={r.quantity}
                    onChange={e=>{ const a=[...batchRows]; a[idx]={...a[idx], quantity:e.target.value}; setBatchRows(a) }} /></td>
                  <td className="p-2"><input type="date" className="w-44 border rounded px-2 py-1" value={r.expiry_date||''}
                    onChange={e=>{ const a=[...batchRows]; a[idx]={...a[idx], expiry_date:e.target.value}; setBatchRows(a) }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* AI 聊天助手（自动补货/加入清单/直接入库） */}
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
      const reason = d?.reason ? `；原因: ${d.reason}` : ''
      const summary = `动作: ${d.action || '未知'}；加入清单: ${r.created_shopping || 0}；直接入库: ${r.imported || 0}${reason}`
      setHistory(h => [...h, { role: 'assistant', text: summary }])
      onDone?.()
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', text: (e?.response?.data?.detail || '执行失败') }])
    } finally {
      setLoading(false)
      setText('')
    }
  }

  return (
    <div className="mt-6 bg-white rounded shadow">
      <div className="px-4 py-2 border-b font-medium">AI 助手</div>
      <div className="p-4 space-y-2 max-h-64 overflow-auto text-sm">
        {history.length === 0 && <div className="text-gray-500">示例：
          “推荐下周要买的基础食材”；“把鸡蛋12个、牛奶2升加到购物清单”；“直接把鸡胸肉2块入库”。
        </div>}
        {history.map((m, i) => (
          <div key={i} className={m.role==='user'? 'text-right' : ''}>
            <span className={m.role==='user'? 'inline-block bg-indigo-50 px-2 py-1 rounded' : 'inline-block bg-gray-100 px-2 py-1 rounded'}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="对我说：推荐补货 / 加入清单 / 直接入库..." value={text} onChange={e=>setText(e.target.value)} />
        <button className="px-3 py-2 bg-fuchsia-700 text-white rounded" disabled={loading} onClick={send}>{loading? '执行中...' : '发送'}</button>
      </div>
    </div>
  )
}
