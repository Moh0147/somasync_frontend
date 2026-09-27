import { useEffect, useState } from 'react'

import { useToast } from '@/components/feedback/Toast'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { getSyncCounts, runSync } from '@/features/sync/syncEngine'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function SyncStatus() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const isOnline = useOnlineStatus()

  const [counts, setCounts] = useState<{ synced: number; pending: number; failed: number } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  async function refresh() {
    setCounts(await getSyncCounts())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSyncNow() {
    if (!user) return
    setIsSyncing(true)
    try {
      const summary = await runSync(user.id, true)
      if (summary.synced > 0) showToast('success', `${summary.synced} item(s) synced.`)
      if (summary.failed > 0) showToast('error', `${summary.failed} item(s) failed to sync.`)
      if (summary.synced === 0 && summary.failed === 0) showToast('info', 'Nothing to sync.')
      await refresh()
    } finally {
      setIsSyncing(false)
    }
  }

  if (!counts) return null
  if (counts.synced === 0 && counts.pending === 0 && counts.failed === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="flex items-center gap-1 text-green-700">
        <span aria-hidden="true">✓</span> {counts.synced} synced
      </span>
      <span className="flex items-center gap-1 text-amber-700">
        <span aria-hidden="true">↻</span> {counts.pending} pending
      </span>
      {counts.failed > 0 && (
        <span className="flex items-center gap-1 text-red-700">
          <span aria-hidden="true">⚠</span> {counts.failed} failed
        </span>
      )}
      <Button size="sm" variant="secondary" disabled={isSyncing || !isOnline} onClick={handleSyncNow}>
        {isSyncing ? 'Syncing…' : 'Sync Now'}
      </Button>
    </div>
  )
}
