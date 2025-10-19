export default function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded shadow w-full max-w-lg">
        <div className="px-4 py-3 border-b font-medium">{title}</div>
        <div className="p-4 space-y-3">{children}</div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button className="px-3 py-1.5 bg-gray-100 rounded" onClick={onClose}>取消</button>
          {actions}
        </div>
      </div>
    </div>
  )
}

