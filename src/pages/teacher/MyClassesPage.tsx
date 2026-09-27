import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listClassLevels } from '@/services/academicsService'
import { listMyClasses } from '@/services/classesService'
import type { ClassLevel } from '@/types/academics'
import type { SchoolClass } from '@/types/class'

export default function MyClassesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setError(null)
    setClasses(null)
    try {
      const [myClasses, levels] = await Promise.all([listMyClasses(user.id), listClassLevels()])
      setClasses(myClasses)
      setClassLevels(levels)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [user])

  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My Classes" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !classes && <LoadingState message="Loading your classes…" />}
      {!error && classes && classes.length === 0 && (
        <EmptyState
          title="You're not assigned to any classes yet."
          description="Your school admin assigns classes to teachers."
        />
      )}
      {!error && classes && classes.length > 0 && (
        <Table
          columns={[
            {
              key: 'name',
              header: 'Class',
              render: (row: SchoolClass) => (
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/classes/${row.id}`)}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {row.name}
                </button>
              ),
            },
            { key: 'level', header: 'Level', render: (row: SchoolClass) => levelName(row.class_level) },
            { key: 'year', header: 'Year', render: (row: SchoolClass) => String(row.academic_year) },
            {
              key: 'status',
              header: 'Status',
              render: (row: SchoolClass) => (
                <StatusBadge status={row.is_active ? 'available' : 'locked'} label={row.is_active ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={classes}
          getRowKey={(row) => String(row.id)}
        />
      )}
    </div>
  )
}
