import type { ReactNode } from 'react'

type StatTileTone = 'primary' | 'secondary' | 'ai' | 'success' | 'error'

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string
  tone?: StatTileTone
}

/** A compact, colour-coded KPI tile with a subtle hover lift. */
const toneConfig: Record<StatTileTone, { icon: string; accent: string; hover: string }> = {
  primary: {
    icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    accent: 'bg-blue-500',
    hover: 'hover:border-blue-200 hover:shadow-blue-100/70 dark:hover:border-blue-500/40 dark:hover:shadow-blue-950/40',
  },
  secondary: {
    icon: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
    accent: 'bg-teal-500',
    hover: 'hover:border-teal-200 hover:shadow-teal-100/70 dark:hover:border-teal-500/40 dark:hover:shadow-teal-950/40',
  },
  ai: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    accent: 'bg-amber-500',
    hover: 'hover:border-amber-200 hover:shadow-amber-100/70 dark:hover:border-amber-500/40 dark:hover:shadow-amber-950/40',
  },
  success: {
    icon: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    accent: 'bg-green-500',
    hover: 'hover:border-green-200 hover:shadow-green-100/70 dark:hover:border-green-500/40 dark:hover:shadow-green-950/40',
  },
  error: {
    icon: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    accent: 'bg-red-500',
    hover: 'hover:border-red-200 hover:shadow-red-100/70 dark:hover:border-red-500/40 dark:hover:shadow-red-950/40',
  },
}

export function StatTile({ icon, label, value, tone = 'primary' }: StatTileProps) {
  const colors = toneConfig[tone]

  return (
    <div
      className={`group relative flex min-h-[130px] flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 ${colors.hover}`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 opacity-75 transition-opacity duration-200 group-hover:opacity-100 ${colors.accent}`} />
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none ${colors.icon}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}
