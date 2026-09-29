import type { ComponentType, SVGProps } from 'react'

import { CheckIcon, ClockIcon, OfflineIcon, SyncIcon, WrongIcon } from './icons'

export type StatusBadgeStatus =
  | 'completed'
  | 'available'
  | 'in-progress'
  | 'locked'
  | 'offline'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'

interface StatusConfig {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>> | null
  className: string
}

// Color carries meaning, not decoration: blue = available/neutral, teal =
// offline/sync/downloads, amber = AI/needs-attention only, green =
// success, red = failure. A status never gets a color outside this table.
const statusConfig: Record<StatusBadgeStatus, StatusConfig> = {
  completed: { label: 'Completed', icon: CheckIcon, className: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
  synced: { label: 'Synced', icon: CheckIcon, className: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
  available: { label: 'Available', icon: null, className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  'in-progress': { label: 'In progress', icon: null, className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  offline: { label: 'Offline', icon: OfflineIcon, className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
  pending: { label: 'Pending', icon: ClockIcon, className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
  syncing: { label: 'Syncing', icon: SyncIcon, className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' },
  failed: { label: 'Failed', icon: WrongIcon, className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
  locked: { label: 'Locked', icon: null, className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

interface StatusBadgeProps {
  status: StatusBadgeStatus
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {Icon && <Icon aria-hidden="true" className="h-3 w-3" />}
      {label ?? config.label}
    </span>
  )
}
