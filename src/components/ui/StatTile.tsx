import type { ReactNode } from 'react'

type StatTileTone = 'primary' | 'secondary' | 'accent' | 'success' | 'error'

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string
  tone?: StatTileTone
}

const toneClasses: Record<StatTileTone, string> = {
  primary: 'bg-blue-600',
  secondary: 'bg-teal-700',
  accent: 'bg-amber-500',
  success: 'bg-green-600',
  error: 'bg-red-600',
}

export function StatTile({ icon, label, value, tone = 'primary' }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white ${toneClasses[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
