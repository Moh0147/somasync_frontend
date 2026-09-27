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
  glyph: string
  className: string
}

const statusConfig: Record<StatusBadgeStatus, StatusConfig> = {
  completed: { label: 'Completed', glyph: '✓', className: 'bg-green-50 text-green-700' },
  synced: { label: 'Synced', glyph: '✓', className: 'bg-green-50 text-green-700' },
  available: { label: 'Available', glyph: '', className: 'bg-blue-50 text-blue-700' },
  'in-progress': { label: 'In progress', glyph: '', className: 'bg-blue-50 text-blue-700' },
  offline: { label: 'Offline', glyph: '⚡', className: 'bg-teal-50 text-teal-700' },
  pending: { label: 'Pending', glyph: '', className: 'bg-amber-50 text-amber-700' },
  syncing: { label: 'Syncing', glyph: '↻', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Failed', glyph: '✗', className: 'bg-red-50 text-red-700' },
  locked: { label: 'Locked', glyph: '', className: 'bg-slate-100 text-slate-600' },
}

interface StatusBadgeProps {
  status: StatusBadgeStatus
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.glyph && <span aria-hidden="true">{config.glyph}</span>}
      {label ?? config.label}
    </span>
  )
}
