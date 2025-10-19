export function SkeletonLine({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-gray-200 ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.6),transparent)] bg-[length:200%_100%] motion-safe:animate-shimmer" />
    </div>
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white rounded shadow ${className}`}>
      <div className="px-4 py-3 border-b">
        <SkeletonLine className="h-5 w-40" />
      </div>
      <div className="p-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

