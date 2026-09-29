import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { getSchool } from '@/services/schoolsService'
import type { School } from '@/types/school'

export default function SchoolSettingsPage() {
  const { user } = useAuth()
  const [school, setSchool] = useState<School | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user?.school) return
    setError(null)
    setSchool(null)
    try {
      setSchool(await getSchool(user.school))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [user?.school])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="School Settings" description="Read-only — changes are made by your system administrator." />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !school && <LoadingState message="Loading school…" />}
      {!error && school && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {school.name} <span className="text-slate-500 dark:text-slate-400">· {school.code}</span>
            </p>
            <StatusBadge status={school.is_active ? 'available' : 'locked'} label={school.is_active ? 'Active' : 'Inactive'} />
          </CardHeader>
          <CardBody>
            <DescriptionList
              items={[
                { label: 'Address', value: school.address || '—' },
                { label: 'Phone', value: school.phone_number || '—' },
                { label: 'Email', value: school.email || '—' },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
