import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CheckIcon, ClockIcon, WrongIcon } from '@/components/ui/icons'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/ui/StatTile'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { getMarkingSummary } from '@/services/markingService'
import type { MarkingSessionSummary } from '@/services/markingService'

function scriptProgress(s: MarkingSessionSummary) {
  const done = (s.counts.FINALIZED ?? 0) + (s.counts.PUBLISHED ?? 0)
  return s.total_scripts > 0 ? (done / s.total_scripts) * 100 : 0
}

export default function MarkingDashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<MarkingSessionSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      setSessions(await getMarkingSummary())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!sessions) return <LoadingState message="Loading dashboard…" />

  const totalScripts = sessions.reduce((a, s) => a + s.total_scripts, 0)
  const totalFinalized = sessions.reduce(
    (a, s) => a + (s.counts.FINALIZED ?? 0) + (s.counts.PUBLISHED ?? 0), 0,
  )
  const totalPending = sessions.reduce(
    (a, s) => a + (s.counts.UPLOADED ?? 0) + (s.counts.MARKED ?? 0) + (s.counts.TEACHER_REVIEW ?? 0), 0,
  )
  const totalFailed = sessions.reduce((a, s) => a + (s.counts.FAILED ?? 0), 0)
  const activeSessions = sessions.filter((s) => s.exam_status === 'MARKING' || s.exam_status === 'REVIEW')

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Welcome, ${name}`}
        description={`${activeSessions.length} active marking session${activeSessions.length !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<ClockIcon className="h-5 w-5" />}
          label="Total scripts"
          value={String(totalScripts)}
          tone="secondary"
        />
        <StatTile
          icon={<CheckIcon className="h-5 w-5" />}
          label="Finalized"
          value={String(totalFinalized)}
          tone="success"
        />
        <StatTile
          icon={<ClockIcon className="h-5 w-5" />}
          label="Pending"
          value={String(totalPending)}
          tone="primary"
        />
        <StatTile
          icon={<WrongIcon className="h-5 w-5" />}
          label="Failed"
          value={String(totalFailed)}
          tone={totalFailed > 0 ? 'error' : 'secondary'}
        />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active sessions</p>
          <Link
            to="/marking/sessions"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all →
          </Link>
        </CardHeader>
        <CardBody>
          {activeSessions.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No active marking sessions.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeSessions.slice(0, 5).map((session) => {
                const pct = scriptProgress(session)
                return (
                  <li key={session.exam_id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/marking/sessions/${session.exam_id}`}
                          className="truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                        >
                          {session.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {session.subject_name} · {session.academic_year} · {session.total_scripts} scripts
                        </p>
                      </div>
                      <StatusBadge
                        status={session.exam_status === 'MARKING' ? 'pending' : 'available'}
                        label={session.exam_status === 'MARKING' ? 'Marking' : 'Review'}
                      />
                    </div>
                    <ProgressBar value={pct} label={`${pct.toFixed(1)}% finalized`} />
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
