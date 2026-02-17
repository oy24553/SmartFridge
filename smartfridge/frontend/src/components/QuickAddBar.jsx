import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'

const STORAGE_KEY = 'sp_quick_presets_v1'

const defaultPresets = [
  { id: 'milk', name: 'Milk', quantity: 2, unit: 'L', expiry_type: 'use_by' },
  { id: 'eggs', name: 'Eggs', quantity: 6, unit: 'pcs', expiry_type: 'best_before' },
  { id: 'bread', name: 'Bread', quantity: 1, unit: 'loaf', expiry_type: 'best_before' },
  { id: 'butter', name: 'Butter', quantity: 1, unit: 'pack', expiry_type: 'best_before' },
  { id: 'cheese', name: 'Cheese', quantity: 1, unit: 'pack', expiry_type: 'best_before' },
  { id: 'chicken', name: 'Chicken breast', quantity: 2, unit: 'pcs', expiry_type: 'use_by' },
  { id: 'tomatoes', name: 'Tomatoes', quantity: 4, unit: 'pcs', expiry_type: 'best_before' },
  { id: 'onions', name: 'Onions', quantity: 3, unit: 'pcs', expiry_type: 'best_before' },
  { id: 'potatoes', name: 'Potatoes', quantity: 1, unit: 'kg', expiry_type: 'best_before' },
]

function safeParse(json) {
  try { return JSON.parse(json) } catch { return null }
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function normalisePreset(p) {
  if (!p || typeof p !== 'object') return null
  const name = String(p.name || '').trim()
  if (!name) return null
  const qty = Number(p.quantity ?? 1)
  return {
    id: String(p.id || newId()),
    name,
    quantity: Number.isFinite(qty) ? qty : 1,
    unit: String(p.unit || '').trim(),
    expiry_type: p.expiry_type === 'use_by' ? 'use_by' : 'best_before',
  }
}

function loadPresets() {
  if (typeof window === 'undefined') return defaultPresets
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? safeParse(raw) : null
  const arr = Array.isArray(parsed) ? parsed.map(normalisePreset).filter(Boolean) : null
  return (arr && arr.length > 0) ? arr : defaultPresets
}

function savePresets(presets) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export default function QuickAddBar({ onAdd }) {
  const [presets, setPresets] = useState(loadPresets)
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [editing, setEditing] = useState(false)
  const selectedCount = selected.size

  const selectedPresets = useMemo(() => {
    const set = selected
    return presets.filter((p) => set.has(p.id))
  }, [presets, selected])

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelected = () => setSelected(new Set())

  const addOne = async (preset) => {
    await onAdd?.([preset])
  }

  const addSelected = async () => {
    if (selectedPresets.length === 0) return
    await onAdd?.(selectedPresets)
    clearSelected()
  }

  const openEdit = () => setEditing(true)
  const closeEdit = () => setEditing(false)

  const updatePreset = (id, patch) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const removePreset = (id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const addPresetRow = () => {
    setPresets((prev) => ([
      ...prev,
      { id: newId(), name: 'New item', quantity: 1, unit: 'pcs', expiry_type: 'best_before' },
    ]))
  }

  const persist = () => {
    const cleaned = presets.map(normalisePreset).filter(Boolean)
    setPresets(cleaned)
    savePresets(cleaned)
    closeEdit()
  }

  return (
    <div className="mb-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-400 mr-1">Quick add:</span>
      {presets.map((p) => {
        const isSelected = selected.has(p.id)
        const base =
          'btn-ghost !px-2 !py-1 text-xs ' +
          (bulkMode && isSelected ? 'bg-indigo-500/15 border-indigo-400/30 text-white' : '')
        return (
          <button
            key={p.id}
            className={base}
            onClick={() => {
              if (bulkMode) toggleSelected(p.id)
              else addOne(p)
            }}
            title={bulkMode ? 'Select' : `Add ${p.quantity}${p.unit ? ` ${p.unit}` : ''}`}
          >
            {bulkMode ? (isSelected ? '✓ ' : '') : ''}
            {p.name}
          </button>
        )
      })}

      <div className="ml-auto flex items-center gap-2">
        <button
          className="btn-ghost !px-2 !py-1 text-xs"
          onClick={() => {
            setBulkMode((v) => !v)
            clearSelected()
          }}
          title="Toggle batch add"
        >
          {bulkMode ? 'Batch: On' : 'Batch: Off'}
        </button>

        {bulkMode && (
          <>
            <button className="btn-primary !px-2 !py-1 text-xs" disabled={selectedCount === 0} onClick={addSelected}>
              Add selected ({selectedCount})
            </button>
            <button className="btn-ghost !px-2 !py-1 text-xs" disabled={selectedCount === 0} onClick={clearSelected}>
              Clear
            </button>
          </>
        )}

        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={openEdit}>
          Edit
        </button>
      </div>

      <Modal
        open={editing}
        title="Edit Quick Add presets"
        onClose={closeEdit}
        actions={<button className="btn-primary" onClick={persist}>Save</button>}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">These presets are saved in your browser (localStorage).</div>
            <button className="btn-soft !px-2 !py-1 text-xs" onClick={addPresetRow}>Add preset</button>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/10 text-slate-300">
                  <th className="p-2">Name</th>
                  <th className="p-2 w-28">Qty</th>
                  <th className="p-2 w-28">Unit</th>
                  <th className="p-2 w-40">Expiry</th>
                  <th className="p-2 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {presets.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2">
                      <input className="input !px-2 !py-1" value={p.name} onChange={(e) => updatePreset(p.id, { name: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <input type="number" step="0.01" className="input !px-2 !py-1" value={p.quantity}
                        onChange={(e) => updatePreset(p.id, { quantity: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <input className="input !px-2 !py-1" value={p.unit}
                        onChange={(e) => updatePreset(p.id, { unit: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <select className="input !px-2 !py-1" value={p.expiry_type}
                        onChange={(e) => updatePreset(p.id, { expiry_type: e.target.value })}>
                        <option value="use_by">Use by</option>
                        <option value="best_before">Best before</option>
                      </select>
                    </td>
                    <td className="p-2 text-right">
                      <button className="btn-ghost !px-2 !py-1 text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/10" onClick={() => removePreset(p.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {presets.length === 0 && (
                  <tr>
                    <td className="p-3 text-slate-400" colSpan={5}>No presets</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}

