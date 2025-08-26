export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-2/3 bg-muted rounded animate-pulse" />
      <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
      <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
    </div>
  )
}


