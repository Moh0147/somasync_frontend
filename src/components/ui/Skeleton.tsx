// A shaped placeholder for content that's still loading -- used where a
// generic spinner would make the layout jump once real content arrives
// (dashboard stat tiles, cards, table rows). Sizing is controlled entirely
// via className (e.g. "h-4 w-24", "h-24 w-full").
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />
}

export function StatTileSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-9 w-9 rounded-md" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
