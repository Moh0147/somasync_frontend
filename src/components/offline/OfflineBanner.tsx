import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="flex items-center gap-2 border-b border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
      <span aria-hidden="true">⚡</span>
      You're offline. Showing downloaded content.
    </div>
  )
}
