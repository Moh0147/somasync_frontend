import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlertIcon, CheckIcon } from '@/components/ui/icons'
import { StatTile } from '@/components/ui/StatTile'
import { getApiErrorMessage } from '@/services/apiError'
import { listSchools } from '@/services/schoolsService'
import type { School } from '@/types/school'

export default function SystemAdminDashboardPage() {
  const [schools, setSchools] = useState<School[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setSchools(null)
    try {
      setSchools(await listSchools())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" description="Platform-wide overview" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !schools && <LoadingState message="Loading schools…" />}
      {!error && schools && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Total Schools"
            value={String(schools.length)}
            tone="primary"
          />
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Active Schools"
            value={String(schools.filter((school) => school.is_active).length)}
            tone="success"
          />
          <StatTile
            icon={<AlertIcon className="h-5 w-5" />}
            label="Inactive Schools"
            value={String(schools.filter((school) => !school.is_active).length)}
            tone="error"
          />
        </div>
      )}
    </div>
  )
}
