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

/* ── Teacher Dashboard skeleton ─────────────────────────────── */
export function TeacherDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <Skeleton className="h-28 w-full rounded-2xl" />

      {/* Pending work */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>

      {/* Classes */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="h-1 bg-slate-100 dark:bg-slate-800" />
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-3 w-20" />
                <div className="mt-auto pt-2 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Student Dashboard skeleton ─────────────────────────────── */
export function StudentDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <Skeleton className="h-28 w-full rounded-2xl" />

      {/* Continue Learning */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-36" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-1 h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-10 w-28 rounded-xl self-start sm:self-center shrink-0" />
          </div>
        </div>
      </div>

      {/* My Subjects */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-h-[205px] rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Exams table skeleton ────────────────────────────────────── */
export function ExamsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header row */}
      <div className="flex gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        {['w-48', 'w-24', 'w-20', 'w-16', 'w-20'].map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      {/* Data rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0 dark:border-slate-800/60">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28 sm:hidden" />
          </div>
          <Skeleton className="hidden sm:block h-3 w-24" />
          <Skeleton className="hidden sm:block h-3 w-16" />
          <Skeleton className="hidden sm:block h-3 w-12" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/* ── Script list skeleton (inside ScriptsPanel) ─────────────── */
export function ScriptListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}
