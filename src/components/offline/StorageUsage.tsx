import { useEffect, useState } from 'react'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatBytes } from '@/utils/formatBytes'

export function StorageUsage() {
  const [estimate, setEstimate] = useState<{ used: number; quota: number } | null>(null)

  useEffect(() => {
    navigator.storage
      ?.estimate()
      .then((result) => setEstimate({ used: result.usage ?? 0, quota: result.quota ?? 0 }))
      .catch(() => setEstimate(null))
  }, [])

  if (!estimate) return null

  const percentage = estimate.quota > 0 ? Math.min(100, Math.round((estimate.used / estimate.quota) * 100)) : 0

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {formatBytes(estimate.used)} / {formatBytes(estimate.quota)} used
      </p>
      <ProgressBar value={percentage} showPercentage={false} />
    </div>
  )
}
