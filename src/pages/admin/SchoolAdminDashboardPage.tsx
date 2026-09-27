import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlertIcon, CheckIcon } from '@/components/ui/icons'
import { StatTile } from '@/components/ui/StatTile'
import { getApiErrorMessage } from '@/services/apiError'
import { listClasses } from '@/services/classesService'
import type { SchoolClass } from '@/types/class'

export default function SchoolAdminDashboardPage() {
  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setClasses(null)
    try {
      setClasses(await listClasses())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" description="School overview" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !classes && <LoadingState message="Loading classes…" />}
      {!error && classes && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Total Classes"
            value={String(classes.length)}
            tone="primary"
          />
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Active Classes"
            value={String(classes.filter((schoolClass) => schoolClass.is_active).length)}
            tone="success"
          />
          <StatTile
            icon={<AlertIcon className="h-5 w-5" />}
            label="Inactive Classes"
            value={String(classes.filter((schoolClass) => !schoolClass.is_active).length)}
            tone="accent"
          />
        </div>
      )}
    </div>
  )
}
