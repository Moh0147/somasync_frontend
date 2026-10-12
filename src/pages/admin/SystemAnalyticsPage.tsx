import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { BarChart } from '@/components/ui/BarChart'
import { StatTile } from '@/components/ui/StatTile'
import { CheckIcon } from '@/components/ui/icons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Table } from '@/components/ui/Table'
import { getApiErrorMessage } from '@/services/apiError'
import { getSystemSchools, getSystemUsage, getSystemUsers } from '@/services/analyticsService'
import type { SystemSchoolRow, SystemUsage, SystemUsers } from '@/types/analytics'
import { roleLabel } from '@/utils/roleLabel'

const KNOWN_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'] as const

export default function SystemAnalyticsPage() {
  const [schools, setSchools] = useState<SystemSchoolRow[] | null>(null)
  const [users, setUsers] = useState<SystemUsers | null>(null)
  const [usage, setUsage] = useState<SystemUsage | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const [schoolsData, usersData, usageData] = await Promise.all([
        getSystemSchools(),
        getSystemUsers(),
        getSystemUsage(),
      ])
      setSchools(schoolsData)
      setUsers(usersData)
      setUsage(usageData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!schools || !users || !usage) return <LoadingState message="Loading analytics…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Analytics" description="Platform-wide" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Schools" value={String(usage.school_count)} tone="primary" />
        <StatTile
          icon={<CheckIcon className="h-5 w-5" />}
          label="Active schools"
          value={String(usage.active_school_count)}
          tone="success"
        />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Total users" value={String(users.total_users)} tone="secondary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Active users" value={String(users.active_users)} tone="success" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Users by role</h2>
        <BarChart
          items={KNOWN_ROLES
            .filter((role) => role in users.by_role)
            .map((role) => ({ label: roleLabel(role), value: users.by_role[role] ?? 0 }))}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Platform activity</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Lessons" value={String(usage.lesson_count)} tone="primary" />
          <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Quizzes" value={String(usage.quiz_count)} tone="primary" />
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Quiz attempts"
            value={String(usage.quiz_attempt_count)}
            tone="primary"
          />
          <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Exams" value={String(usage.exam_count)} tone="primary" />
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="AI requests"
            value={String(usage.ai_explanation_request_count)}
            tone="ai"
          />
          <StatTile
            icon={<CheckIcon className="h-5 w-5" />}
            label="Sync records"
            value={String(usage.sync_record_count)}
            tone="secondary"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Schools</h2>
        <Table
          columns={[
            { key: 'name', header: 'School', render: (row: SystemSchoolRow) => row.name },
            { key: 'code', header: 'Code', render: (row: SystemSchoolRow) => row.code },
            { key: 'students', header: 'Students', render: (row: SystemSchoolRow) => String(row.student_count) },
            { key: 'teachers', header: 'Teachers', render: (row: SystemSchoolRow) => String(row.teacher_count) },
            { key: 'classes', header: 'Classes', render: (row: SystemSchoolRow) => String(row.class_count) },
            {
              key: 'status',
              header: 'Status',
              render: (row: SystemSchoolRow) => (
                <StatusBadge status={row.is_active ? 'available' : 'locked'} label={row.is_active ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={schools}
          getRowKey={(row) => String(row.school_id)}
        />
      </div>
    </div>
  )
}
