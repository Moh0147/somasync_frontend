import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listExams, startMarking } from '@/services/examsService'
import { getMarkingSummary } from '@/services/markingService'
import type { MarkingSessionSummary } from '@/services/markingService'
import type { Exam } from '@/types/exam'

const EXAM_STATUS_BADGE: Record<string, StatusBadgeStatus> = {
  MARKING: 'pending',
  REVIEW: 'available',
  FINALIZED: 'completed',
  RESULTS_PUBLISHED: 'completed',
}

const EXAM_STATUS_LABEL: Record<string, string> = {
  MARKING: 'Marking',
  REVIEW: 'Review',
  FINALIZED: 'Finalized',
  RESULTS_PUBLISHED: 'Published',
}

function ScriptCountBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {count} {label}
    </span>
  )
}

export default function MarkingSessionsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<MarkingSessionSummary[] | null>(null)
  const [closedExams, setClosedExams] = useState<Exam[]>([])
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState<number | null>(null)

  const isManager = (user?.active_role ?? user?.role) === 'EXAM_MARKING_MANAGER'

  async function load() {
    setError(null)
    try {
      const [summary, allExams] = await Promise.all([
        getMarkingSummary(),
        isManager ? listExams() : Promise.resolve([]),
      ])
      setSessions(summary)
      if (isManager) {
        const activeIds = new Set(summary.map((s) => s.exam_id))
        setClosedExams(allExams.filter((e) => e.status === 'CLOSED' && !activeIds.has(e.id)))
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [])

  async function handleStartMarking(examId: number) {
    setStarting(examId)
    try {
      await startMarking(examId)
      showToast('success', 'Alama imeanza (Marking started).')
      load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setStarting(null)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!sessions) return <LoadingState message="Loading sessions…" />

  const active = sessions.filter((s) => s.exam_status === 'MARKING' || s.exam_status === 'REVIEW')
  const past = sessions.filter((s) => s.exam_status !== 'MARKING' && s.exam_status !== 'REVIEW')

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Marking Sessions"
        description="All exams in the marking lifecycle for your school."
      />

      {isManager && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Ready to Start ({closedExams.length})
            </p>
          </CardHeader>
          <CardBody>
            {closedExams.length === 0 ? (
              <p className="py-1 text-sm text-slate-500 dark:text-slate-400">
                Hakuna mitihani inayosubiri. Mwalimu afunge mtihani (CLOSED) ili uonekane hapa.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {closedExams.map((exam) => (
                  <li key={exam.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {exam.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {exam.academic_year} · Imefungwa, inasubiri alama
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={starting === exam.id}
                      onClick={() => handleStartMarking(exam.id)}
                    >
                      {starting === exam.id ? 'Inaanza…' : 'Anza Alama'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Active ({active.length})
          </p>
        </CardHeader>
        <CardBody>
          {active.length === 0 ? (
            <EmptyState title="No active sessions." description="Exams in MARKING or REVIEW phase will appear here." />
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {active.map((session) => <SessionRow key={session.exam_id} session={session} />)}
            </ul>
          )}
        </CardBody>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Past ({past.length})
            </p>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {past.map((session) => <SessionRow key={session.exam_id} session={session} />)}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function SessionRow({ session }: { session: MarkingSessionSummary }) {
  const finalized = (session.counts.FINALIZED ?? 0) + (session.counts.PUBLISHED ?? 0)
  const pct = session.total_scripts > 0 ? Math.round((finalized / session.total_scripts) * 100) : 0

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/marking/sessions/${session.exam_id}`}
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
          >
            {session.title}
          </Link>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {session.subject_name} · {session.academic_year}
          </p>
        </div>
        <StatusBadge
          status={EXAM_STATUS_BADGE[session.exam_status] ?? 'pending'}
          label={EXAM_STATUS_LABEL[session.exam_status] ?? session.exam_status}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ScriptCountBadge
          label="uploaded" count={session.counts.UPLOADED ?? 0}
          color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <ScriptCountBadge
          label="marked" count={session.counts.MARKED ?? 0}
          color="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <ScriptCountBadge
          label="in review" count={session.counts.TEACHER_REVIEW ?? 0}
          color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <ScriptCountBadge
          label="finalized" count={finalized}
          color="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        />
        <ScriptCountBadge
          label="failed" count={session.counts.FAILED ?? 0}
          color="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        />
      </div>

      <ProgressBar value={pct} label={`${finalized}/${session.total_scripts} finalized`} />
    </li>
  )
}
