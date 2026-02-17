import { useEffect, useState } from 'react'
import api from '../lib/apiClient.js'
import Modal from '../components/Modal.jsx'
import { SkeletonLine } from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

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
            <div key={i} className="glass-card p-5">
              <SkeletonLine className="h-5 w-56 mb-2" />
              <SkeletonLine className="h-4 w-80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-rose-300">{error}</p>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-white/10 transition-all hover:shadow-xl">
          {items.length === 0 && <EmptyState title="No inventory items" hint='Click "New" or use "AI Import" to add items.' />}
          {items.map((it) => (
            <div
              key={it.id}
              className={
                `px-5 py-4 flex items-start justify-between motion-safe:animate-fade-in-up ` +
                ((typeof it.days_to_expiry === 'number' && it.days_to_expiry < 0)
                  ? 'bg-rose-500/10 ring-1 ring-rose-500/20 rounded'
                  : (typeof it.days_to_expiry === 'number' && it.days_to_expiry <= 2)
                    ? 'bg-amber-500/10 ring-1 ring-amber-500/20 rounded'
                    : '')
              }
            >
              <div>
                <div className="font-medium flex items-center">
                  <span>{it.name}</span>
                  {it.is_low_stock && (
                    <span className="ml-2 text-xs text-rose-300">Low stock</span>
                  )}
                  {(typeof it.days_to_expiry === 'number' && it.days_to_expiry <= 2) && (
                    <span className="ml-2 relative inline-flex">
                      <span className="absolute inline-flex h-2 w-2 rounded-full bg-rose-400/70"></span>
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-300">
                  {it.quantity}{it.unit} · min {it.min_stock}{it.unit} · {it.location || 'Unassigned'}
                  {it.expiry_date ? ` · Exp: ${it.expiry_date}` : ''}
                  {typeof it.days_to_expiry === 'number' ? ` · D-${it.days_to_expiry}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-soft !px-2 !py-1 text-xs" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: -1, action: 'consume' }); fetchItems({ q }) }}>-1</button>
                <button className="btn-soft !px-2 !py-1 text-xs" onClick={async()=>{ await api.post(`/api/v1/inventory/items/${it.id}/adjust/`, { delta: 1, action: 'add' }); fetchItems({ q }) }}>+1</button>
                <button className="btn-ghost !px-2 !py-1 text-xs" onClick={()=>{ setEditItem(it); setEditOpen(true) }}>Edit</button>
                <button className="btn-ghost !px-2 !py-1 text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/10" onClick={async()=>{ await api.delete(`/api/v1/inventory/items/${it.id}/`); fetchItems({ q }) }}>Delete</button>
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
        actions={<button className="btn-primary" onClick={async()=>{
          try {
            await api.post('/api/v1/inventory/items/', form)
            setOpenNew(false)
            setForm({ name: '', quantity: 1, unit: 'pcs', location: '', category: '', container: '', min_stock: 0, expiry_date: '', notes: '' })
            fetchItems({ q })
          } catch (e) { alert('Create failed') }
        }}>Save</button>}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2">Name<input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></label>
          <label>Quantity<input className="input" type="number" step="0.01" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})}/></label>
          <label>Unit<input className="input" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})}/></label>
          <label>Min stock<input className="input" type="number" step="0.01" value={form.min_stock} onChange={e=>setForm({...form, min_stock: e.target.value})}/></label>
          <label>Expiry<input className="input" type="date" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})}/></label>
          <label>Category<input className="input" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}/></label>
          <label>Location<input className="input" value={form.location} onChange={e=>setForm({...form, location: e.target.value})}/></label>
          <label>Container<input className="input" value={form.container} onChange={e=>setForm({...form, container: e.target.value})}/></label>
          <label className="col-span-2">Notes<textarea className="input min-h-24" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></label>
        </div>
      </Modal>

      {/* Bulk import */}
      <Modal
        open={openBulk}
        title="Bulk Import (each line: name,quantity,unit,expiry[optional])"
        onClose={()=>setOpenBulk(false)}
        actions={<button className="btn-primary" onClick={async()=>{
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
        <textarea className="input h-48" placeholder="chicken breast,2,pcs,2025-12-01\nmilk,500,ml,2025-11-20" value={bulkText} onChange={e=>setBulkText(e.target.value)} />
      </Modal>

      {/* AI free-text import */}
      <Modal
        open={openAI}
        title="AI Free-text Import"
        onClose={()=>{ setOpenAI(false); setAiText(''); setAiItems([]); setAiLoading(false) }}
        actions={<>
          {aiItems.length>0 && (
            <button className="btn-soft mr-2" onClick={async()=>{
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
          <button className="btn-primary mr-2" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
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
          <button className="btn-soft" disabled={aiLoading || !aiText.trim()} onClick={async()=>{
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
        <textarea className="input h-40" placeholder="Paste shopping list or description, e.g.\nchicken breast 2 pcs, milk 500ml, 3 apples; drink milk within 3 days." value={aiText} onChange={e=>setAiText(e.target.value)} />
        {aiItems.length>0 && (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-white/10 text-sm font-medium text-slate-100">Parsed Results (ready to import)</div>
            <ul className="divide-y divide-white/10 max-h-60 overflow-auto">
              {aiItems.map((it, idx)=>(
                <li key={idx} className="px-3 py-2 text-sm flex gap-2 items-center">
                  <input className="input !w-40 !px-2 !py-1" value={it.name||''} onChange={e=>{
                    const a=[...aiItems]; a[idx]={...a[idx], name:e.target.value}; setAiItems(a)
                  }} />
                  <input type="number" step="0.01" className="input !w-24 !px-2 !py-1" value={it.quantity||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], quantity:e.target.value}; setAiItems(a) }} />
                  <input className="input !w-20 !px-2 !py-1" placeholder="Unit" value={it.unit||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], unit:e.target.value}; setAiItems(a) }} />
                  <input type="date" className="input !w-40 !px-2 !py-1" value={it.expiry_date||''} onChange={e=>{ const a=[...aiItems]; a[idx]={...a[idx], expiry_date:e.target.value}; setAiItems(a) }} />
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
        actions={<button className="btn-primary" onClick={async()=>{
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
            <label className="col-span-2">Name<input className="input" value={editItem.name} onChange={e=>setEditItem({...editItem, name: e.target.value})}/></label>
            <label>Unit<input className="input" value={editItem.unit||''} onChange={e=>setEditItem({...editItem, unit: e.target.value})}/></label>
            <label>Min stock<input className="input" type="number" step="0.01" value={editItem.min_stock||0} onChange={e=>setEditItem({...editItem, min_stock: e.target.value})}/></label>
            <label>Expiry<input className="input" type="date" value={editItem.expiry_date||''} onChange={e=>setEditItem({...editItem, expiry_date: e.target.value})}/></label>
            <label>Category<input className="input" value={editItem.category||''} onChange={e=>setEditItem({...editItem, category: e.target.value})}/></label>
            <label>Location<input className="input" value={editItem.location||''} onChange={e=>setEditItem({...editItem, location: e.target.value})}/></label>
            <label>Container<input className="input" value={editItem.container||''} onChange={e=>setEditItem({...editItem, container: e.target.value})}/></label>
            <label className="col-span-2">Notes<textarea className="input min-h-24" value={editItem.notes||''} onChange={e=>setEditItem({...editItem, notes: e.target.value})}/></label>
          </div>
        )}
      </Modal>
    </div>
  )
}
