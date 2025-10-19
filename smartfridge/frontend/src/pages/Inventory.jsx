import { useEffect, useState } from 'react'
import api from '../lib/apiClient.js'
import Modal from '../components/Modal.jsx'
import { SkeletonLine } from '../components/Skeleton.jsx'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [error, setError] = useState(null)
  const [openNew, setOpenNew] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [openAI, setOpenAI] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: 1, unit: 'pcs', location: '', category: '', container: '', min_stock: 0, expiry_date: '', notes: '' })
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [bulkText, setBulkText] = useState('')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiItems, setAiItems] = useState([])

  const fetchItems = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/v1/inventory/items/', { params })
      setItems(data)
      setError(null)
    } catch (e) {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          placeholder="搜索名称/分类/位置"
          className="border px-3 py-2 rounded w-full"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="px-3 py-2 bg-gray-900 text-white rounded" onClick={()=>fetchItems({ q })}>搜索</button>
        <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={()=>setOpenNew(true)}>新增</button>
        <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={()=>setOpenBulk(true)}>批量入库</button>
        <button className="px-3 py-2 bg-fuchsia-700 text-white rounded" onClick={()=>setOpenAI(true)}>AI 入库</button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded shadow">
              <SkeletonLine className="h-5 w-56 mb-2" />
              <SkeletonLine className="h-4 w-80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="bg-white shadow rounded divide-y transition-all hover:shadow-lg">
          {items.length === 0 && <p className="p-4 text-gray-500">暂无数据</p>}
          {items.map((it) => (
            <div
              key={it.id}
              className={
                `p-4 flex items-start justify-between motion-safe:animate-fade-in-up ` +
                ((typeof it.days_to_expiry === 'number' && it.days_to_expiry < 0)
                  ? 'bg-red-50 ring-1 ring-red-200 rounded'
                  : (typeof it.days_to_expiry === 'number' && it.days_to_expiry <= 2)
                    ? 'bg-amber-50 ring-1 ring-amber-200 rounded'
                    : '')
              }
            >
              <div>
                <div className="font-medium flex items-center">
                  <span>{it.name}</span>
                  {it.is_low_stock && (
                    <span className="ml-2 text-xs text-red-600 animate-pulse">低库存</span>
                  )}
                  {(typeof it.days_to_expiry === 'number' && it.days_to_expiry <= 2) && (
                    <span className="ml-2 relative inline-flex">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {it.quantity}{it.unit} · 最低 {it.min_stock}{it.unit} · {it.location || '未标记'}
                  {it.expiry_date ? ` · 到期: ${it.expiry_date}` : ''}
                  {typeof it.days_to_expiry === 'number' ? ` · D-${it.days_to_expiry}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-gray-100 rounded transition-transform hover:scale-105" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: -1, action: 'consume' }); fetchItems({ q }) }}>-1</button>
                <button className="px-2 py-1 bg-gray-100 rounded transition-transform hover:scale-105" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: 1, action: 'add' }); fetchItems({ q }) }}>+1</button>
                <button className="px-2 py-1 bg-blue-50 text-blue-700 rounded" onClick={()=>{ setEditItem(it); setEditOpen(true) }}>编辑</button>
                <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/items/${it.id}/`); fetchItems({ q }) }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增条目 */}
      <Modal
        open={openNew}
        title="新增库存"
        onClose={()=>setOpenNew(false)}
        actions={<button className="px-3 py-1.5 bg-gray-900 text-white rounded" onClick={async()=>{
          try {
            await api.post('/api/v1/inventory/items/', form)
            setOpenNew(false)
            setForm({ name: '', quantity: 1, unit: 'pcs', location: '', category: '', container: '', min_stock: 0, expiry_date: '', notes: '' })
            fetchItems({ q })
          } catch (e) { alert('创建失败') }
        }}>保存</button>}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2">名称<input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></label>
          <label>数量<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})}/></label>
          <label>单位<input className="w-full border rounded px-3 py-2" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})}/></label>
          <label>最低库存<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.min_stock} onChange={e=>setForm({...form, min_stock: e.target.value})}/></label>
          <label>到期日<input className="w-full border rounded px-3 py-2" type="date" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})}/></label>
          <label>分类<input className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}/></label>
          <label>位置<input className="w-full border rounded px-3 py-2" value={form.location} onChange={e=>setForm({...form, location: e.target.value})}/></label>
          <label>容器<input className="w-full border rounded px-3 py-2" value={form.container} onChange={e=>setForm({...form, container: e.target.value})}/></label>
          <label className="col-span-2">备注<textarea className="w-full border rounded px-3 py-2" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></label>
        </div>
      </Modal>

      {/* 批量入库 */}
      <Modal
        open={openBulk}
        title="批量入库 (每行: 名称,数量,单位,到期[可选])"
        onClose={()=>setOpenBulk(false)}
        actions={<button className="px-3 py-1.5 bg-indigo-600 text-white rounded" onClick={async()=>{
          const items = bulkText.split('\n').map(l=>l.trim()).filter(Boolean).map(line=>{
            const [name, quantity, unit, expiry_date] = line.split(',').map(s=>s?.trim())
            return { name, quantity: Number(quantity||0), unit: unit||'pcs', expiry_date }
          })
          try {
            await api.post('/api/v1/inventory/items/bulk/', { items })
            setOpenBulk(false)
            setBulkText('')
            fetchItems({ q })
          } catch (e) { alert('批量入库失败') }
        }}>导入</button>}
      >
        <textarea className="w-full h-48 border rounded px-3 py-2" placeholder="鸡胸肉,2,pcs,2025-12-01\n牛奶,500,ml,2025-11-20" value={bulkText} onChange={e=>setBulkText(e.target.value)} />
      </Modal>

      {/* AI 自由文本入库 */}
      <Modal
        open={openAI}
        title="AI 自由文本入库"
        onClose={()=>{ setOpenAI(false); setAiText(''); setAiItems([]); setAiLoading(false) }}
        actions={<>
          {aiItems.length>0 && (
            <button className="px-3 py-1.5 bg-emerald-600 text-white rounded mr-2" onClick={async()=>{
              try {
                const items = aiItems.map(i=>({
                  name: i.name,
                  quantity: Number(i.quantity||1),
                  unit: i.unit || 'pcs',
                  expiry_date: i.expiry_date || undefined,
                }))
                await api.post('/api/v1/inventory/items/bulk/', { items })
                setOpenAI(false); setAiItems([]); setAiText('')
                fetchItems({ q })
              } catch(e) { alert('导入失败') }
            }}>导入</button>
          )}
          <button className="px-3 py-1.5 bg-fuchsia-700 text-white rounded mr-2" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
            setAiLoading(true)
            try {
              await api.post('/api/v1/ai/parse-items-import/', { text: aiText })
              setOpenAI(false); setAiText(''); setAiItems([])
              fetchItems({ q })
            } catch(e) {
              const msg = e?.response?.data?.detail || e?.message || '解析/入库失败'
              alert(msg)
            } finally { setAiLoading(false) }
          }}>解析并入库</button>
          <button className="px-3 py-1.5 bg-gray-900 text-white rounded" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
            setAiLoading(true)
            try {
              const { data } = await api.post('/api/v1/ai/parse-items/', { text: aiText })
              setAiItems(data.items || [])
            } catch(e) { 
              const msg = e?.response?.data?.detail || e?.message || '解析失败'
              alert(msg)
              setAiItems([]) 
            } finally { setAiLoading(false) }
          }}>{aiLoading? '解析中...' : '解析'}</button>
        </>}
      >
        <textarea className="w-full h-40 border rounded px-3 py-2" placeholder="粘贴购物清单或描述，例如：\n买鸡胸肉2块、牛奶500ml、苹果3个，牛奶三天内喝完。" value={aiText} onChange={e=>setAiText(e.target.value)} />
        {aiItems.length>0 && (
          <div className="border rounded">
            <div className="px-3 py-2 border-b text-sm font-medium">解析结果（可直接导入）</div>
            <ul className="divide-y max-h-60 overflow-auto">
              {aiItems.map((it, idx)=>(
                <li key={idx} className="px-3 py-2 text-sm flex gap-2 items-center">
                  <input className="w-40 border rounded px-2 py-1" value={it.name||''} onChange={e=>{
                    const a=[...aiItems]; a[idx]={...a[idx], name:e.target.value}; setAiItems(a)
                  }} />
                  <input type="number" step="0.01" className="w-24 border rounded px-2 py-1" value={it.quantity||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], quantity:e.target.value}; setAiItems(a) }} />
                  <input className="w-20 border rounded px-2 py-1" placeholder="单位" value={it.unit||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], unit:e.target.value}; setAiItems(a) }} />
                  <input type="date" className="w-40 border rounded px-2 py-1" value={it.expiry_date||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], expiry_date:e.target.value}; setAiItems(a) }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* 编辑条目 */}
      <Modal
        open={editOpen}
        title={editItem ? `编辑：${editItem.name}` : '编辑'}
        onClose={()=>{ setEditOpen(false); setEditItem(null) }}
        actions={<button className="px-3 py-1.5 bg-blue-600 text-white rounded" onClick={async()=>{
          if (!editItem) return
          const payload = {
            name: editItem.name,
            unit: editItem.unit,
            category: editItem.category,
            location: editItem.location,
            container: editItem.container,
            min_stock: editItem.min_stock,
            expiry_date: editItem.expiry_date,
            notes: editItem.notes,
          }
          try {
            await api.patch(`/api/v1/inventory/items/${editItem.id}/`, payload)
            setEditOpen(false); setEditItem(null); fetchItems({ q })
          } catch (e) { alert('保存失败') }
        }}>保存</button>}
      >
        {editItem && (
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2">名称<input className="w-full border rounded px-3 py-2" value={editItem.name} onChange={e=>setEditItem({...editItem, name: e.target.value})}/></label>
            <label>单位<input className="w-full border rounded px-3 py-2" value={editItem.unit||''} onChange={e=>setEditItem({...editItem, unit: e.target.value})}/></label>
            <label>最低库存<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={editItem.min_stock||0} onChange={e=>setEditItem({...editItem, min_stock: e.target.value})}/></label>
            <label>到期日<input className="w-full border rounded px-3 py-2" type="date" value={editItem.expiry_date||''} onChange={e=>setEditItem({...editItem, expiry_date: e.target.value})}/></label>
            <label>分类<input className="w-full border rounded px-3 py-2" value={editItem.category||''} onChange={e=>setEditItem({...editItem, category: e.target.value})}/></label>
            <label>位置<input className="w-full border rounded px-3 py-2" value={editItem.location||''} onChange={e=>setEditItem({...editItem, location: e.target.value})}/></label>
            <label>容器<input className="w-full border rounded px-3 py-2" value={editItem.container||''} onChange={e=>setEditItem({...editItem, container: e.target.value})}/></label>
            <label className="col-span-2">备注<textarea className="w-full border rounded px-3 py-2" value={editItem.notes||''} onChange={e=>setEditItem({...editItem, notes: e.target.value})}/></label>
          </div>
        )}
      </Modal>
    </div>
  )
}
