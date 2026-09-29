import { OfflineIcon } from '@/components/ui/icons'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="flex items-center gap-1.5 border-b border-teal-100 bg-teal-50/60 px-4 py-1.5 text-xs font-medium text-teal-700 dark:border-teal-500/10 dark:bg-teal-500/5 dark:text-teal-400">
      <OfflineIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      You're offline — showing downloaded content.
    </div>
  )
}
