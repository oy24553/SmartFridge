export default function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 font-medium text-slate-100">{title}</div>
        <div className="p-4 space-y-3 text-slate-100">{children}</div>
        <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
          <button className="btn-soft" onClick={onClose}>Cancel</button>
          {actions}
        </div>
      </div>
    </div>
  )
}
