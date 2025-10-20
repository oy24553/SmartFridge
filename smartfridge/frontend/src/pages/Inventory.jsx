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
      setError('Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="flex items-center gap-2 mb-4">
        <input
          placeholder="Search name/category/location"
          className="input"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="btn-primary" onClick={()=>fetchItems({ q })}>Search</button>
        <button className="btn-ghost" onClick={()=>setOpenNew(true)}>New</button>
        <button className="btn-ghost" onClick={()=>setOpenBulk(true)}>Bulk Import</button>
        <button className="btn-ghost" onClick={()=>setOpenAI(true)}>AI Import</button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 bg-white rounded shadow">
              <SkeletonLine className="h-5 w-56 mb-2" />
              <SkeletonLine className="h-4 w-80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="glass-card rounded-2xl divide-y transition-all hover:shadow-xl">
          {items.length === 0 && <p className="p-4 text-gray-500">No data</p>}
          {items.map((it) => (
            <div
              key={it.id}
              className={
                `px-5 py-4 flex items-start justify-between motion-safe:animate-fade-in-up ` +
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
                    <span className="ml-2 text-xs text-red-600 animate-pulse">Low stock</span>
                  )}
                  {(typeof it.days_to_expiry === 'number' && it.days_to_expiry <= 2) && (
                    <span className="ml-2 relative inline-flex">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {it.quantity}{it.unit} · min {it.min_stock}{it.unit} · {it.location || 'Unassigned'}
                  {it.expiry_date ? ` · Exp: ${it.expiry_date}` : ''}
                  {typeof it.days_to_expiry === 'number' ? ` · D-${it.days_to_expiry}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-gray-100 rounded transition-transform hover:scale-105" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: -1, action: 'consume' }); fetchItems({ q }) }}>-1</button>
                <button className="px-2 py-1 bg-gray-100 rounded transition-transform hover:scale-105" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: 1, action: 'add' }); fetchItems({ q }) }}>+1</button>
                <button className="px-2 py-1 bg-blue-50 text-blue-700 rounded" onClick={()=>{ setEditItem(it); setEditOpen(true) }}>Edit</button>
                <button className="px-2 py-1 bg-red-50 text-red-700 rounded" onClick={async()=>{ await api.delete(`/api/v1/inventory/items/${it.id}/`); fetchItems({ q }) }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New item */}
      <Modal
        open={openNew}
        title="New Inventory"
        onClose={()=>setOpenNew(false)}
        actions={<button className="px-3 py-1.5 bg-gray-900 text-white rounded" onClick={async()=>{
          try {
            await api.post('/api/v1/inventory/items/', form)
            setOpenNew(false)
            setForm({ name: '', quantity: 1, unit: 'pcs', location: '', category: '', container: '', min_stock: 0, expiry_date: '', notes: '' })
            fetchItems({ q })
          } catch (e) { alert('Create failed') }
        }}>Save</button>}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2">Name<input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></label>
          <label>Quantity<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})}/></label>
          <label>Unit<input className="w-full border rounded px-3 py-2" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})}/></label>
          <label>Min stock<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.min_stock} onChange={e=>setForm({...form, min_stock: e.target.value})}/></label>
          <label>Expiry<input className="w-full border rounded px-3 py-2" type="date" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})}/></label>
          <label>Category<input className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}/></label>
          <label>Location<input className="w-full border rounded px-3 py-2" value={form.location} onChange={e=>setForm({...form, location: e.target.value})}/></label>
          <label>Container<input className="w-full border rounded px-3 py-2" value={form.container} onChange={e=>setForm({...form, container: e.target.value})}/></label>
          <label className="col-span-2">Notes<textarea className="w-full border rounded px-3 py-2" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></label>
        </div>
      </Modal>

      {/* Bulk import */}
      <Modal
        open={openBulk}
        title="Bulk Import (each line: name,quantity,unit,expiry[optional])"
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
          } catch (e) { alert('Bulk import failed') }
        }}>Import</button>}
      >
        <textarea className="w-full h-48 border rounded px-3 py-2" placeholder="chicken breast,2,pcs,2025-12-01\nmilk,500,ml,2025-11-20" value={bulkText} onChange={e=>setBulkText(e.target.value)} />
      </Modal>

      {/* AI free-text import */}
      <Modal
        open={openAI}
        title="AI Free-text Import"
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
              } catch(e) { alert('Import failed') }
            }}>Import</button>
          )}
          <button className="px-3 py-1.5 bg-fuchsia-700 text-white rounded mr-2" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
            setAiLoading(true)
            try {
              await api.post('/api/v1/ai/parse-items-import/', { text: aiText })
              setOpenAI(false); setAiText(''); setAiItems([])
              fetchItems({ q })
            } catch(e) {
              const msg = e?.response?.data?.detail || e?.message || 'Parse/Import failed'
              alert(msg)
            } finally { setAiLoading(false) }
          }}>Parse & Import</button>
          <button className="px-3 py-1.5 bg-gray-900 text-white rounded" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
            setAiLoading(true)
            try {
              const { data } = await api.post('/api/v1/ai/parse-items/', { text: aiText })
              setAiItems(data.items || [])
            } catch(e) { 
              const msg = e?.response?.data?.detail || e?.message || 'Parse failed'
              alert(msg)
              setAiItems([]) 
            } finally { setAiLoading(false) }
          }}>{aiLoading? 'Parsing...' : 'Parse'}</button>
        </>}
      >
        <textarea className="w-full h-40 border rounded px-3 py-2" placeholder="Paste shopping list or description, e.g.\nchicken breast 2 pcs, milk 500ml, 3 apples; drink milk within 3 days." value={aiText} onChange={e=>setAiText(e.target.value)} />
        {aiItems.length>0 && (
          <div className="border rounded">
            <div className="px-3 py-2 border-b text-sm font-medium">Parsed Results (ready to import)</div>
            <ul className="divide-y max-h-60 overflow-auto">
              {aiItems.map((it, idx)=>(
                <li key={idx} className="px-3 py-2 text-sm flex gap-2 items-center">
                  <input className="w-40 border rounded px-2 py-1" value={it.name||''} onChange={e=>{
                    const a=[...aiItems]; a[idx]={...a[idx], name:e.target.value}; setAiItems(a)
                  }} />
                  <input type="number" step="0.01" className="w-24 border rounded px-2 py-1" value={it.quantity||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], quantity:e.target.value}; setAiItems(a) }} />
                  <input className="w-20 border rounded px-2 py-1" placeholder="Unit" value={it.unit||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], unit:e.target.value}; setAiItems(a) }} />
                  <input type="date" className="w-40 border rounded px-2 py-1" value={it.expiry_date||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], expiry_date:e.target.value}; setAiItems(a) }} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Edit item */}
      <Modal
        open={editOpen}
        title={editItem ? `Edit: ${editItem.name}` : 'Edit'}
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
          } catch (e) { alert('Save failed') }
        }}>Save</button>}
      >
        {editItem && (
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2">Name<input className="w-full border rounded px-3 py-2" value={editItem.name} onChange={e=>setEditItem({...editItem, name: e.target.value})}/></label>
            <label>Unit<input className="w-full border rounded px-3 py-2" value={editItem.unit||''} onChange={e=>setEditItem({...editItem, unit: e.target.value})}/></label>
            <label>Min stock<input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={editItem.min_stock||0} onChange={e=>setEditItem({...editItem, min_stock: e.target.value})}/></label>
            <label>Expiry<input className="w-full border rounded px-3 py-2" type="date" value={editItem.expiry_date||''} onChange={e=>setEditItem({...editItem, expiry_date: e.target.value})}/></label>
            <label>Category<input className="w-full border rounded px-3 py-2" value={editItem.category||''} onChange={e=>setEditItem({...editItem, category: e.target.value})}/></label>
            <label>Location<input className="w-full border rounded px-3 py-2" value={editItem.location||''} onChange={e=>setEditItem({...editItem, location: e.target.value})}/></label>
            <label>Container<input className="w-full border rounded px-3 py-2" value={editItem.container||''} onChange={e=>setEditItem({...editItem, container: e.target.value})}/></label>
            <label className="col-span-2">Notes<textarea className="w-full border rounded px-3 py-2" value={editItem.notes||''} onChange={e=>setEditItem({...editItem, notes: e.target.value})}/></label>
          </div>
        )}
      </Modal>
    </div>
  )
}
