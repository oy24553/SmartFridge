export default function EmptyState({ title = 'Nothing here yet', hint = 'Add your first item to get started.' }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="scan-sweep glass-card px-5 py-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="rgba(165,180,252,.85)" strokeWidth="1.6" />
              <path d="M8 7h8" stroke="rgba(148,163,184,.7)" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 11h8" stroke="rgba(148,163,184,.55)" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M9 16h6" stroke="rgba(148,163,184,.45)" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="18.5" cy="5.5" r="1.5" fill="rgba(99,102,241,.8)" />
            </svg>
          </div>
          <div className="font-heading font-semibold text-slate-100">{title}</div>
          <div className="mt-1 text-sm text-slate-300">{hint}</div>
          <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400/70" />
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400/40" />
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400/25" />
          </div>
        </div>
      </div>
    </div>
  )
}

