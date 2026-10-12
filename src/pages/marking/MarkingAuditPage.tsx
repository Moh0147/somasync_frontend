import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/services/apiError'
import { listAuditLog } from '@/services/markingService'
import type { AuditEntry } from '@/services/markingService'

const ACTION_LABELS: Record<string, string> = {
  SCRIPT_SUBMITTED: 'Submitted for review',
  SCRIPT_FINALIZED: 'Finalized',
  SCRIPT_AI_MARKED: 'AI marked',
  SCRIPT_OCR_RAN: 'OCR ran',
  SCRIPT_RESET: 'Emergency reset',
  ANSWER_MARKED: 'Answer marked',
  SCRIPT_ASSIGNED: 'Script assigned',
  SCRIPT_UNASSIGNED: 'Assignment removed',
}

const ACTION_COLOR: Record<string, string> = {
  SCRIPT_FINALIZED: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
  SCRIPT_RESET: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  SCRIPT_SUBMITTED: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
  ANSWER_MARKED: 'text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30',
}
const DEFAULT_COLOR = 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'

const ACTIONS = [
  { key: '', label: 'All actions' },
  { key: 'SCRIPT_SUBMITTED', label: 'Submitted' },
  { key: 'SCRIPT_FINALIZED', label: 'Finalized' },
  { key: 'SCRIPT_AI_MARKED', label: 'AI marked' },
  { key: 'SCRIPT_OCR_RAN', label: 'OCR' },
  { key: 'SCRIPT_RESET', label: 'Reset' },
  { key: 'ANSWER_MARKED', label: 'Answer marked' },
  { key: 'SCRIPT_ASSIGNED', label: 'Assigned' },
]

export default function MarkingAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load(p = page) {
    setError(null)
    try {
      const res = await listAuditLog({
        page: p,
        action: actionFilter || undefined,
        actor: actorFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setEntries(res.results)
      setCount(res.count)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load(1); setPage(1) }, [actionFilter, actorFilter, dateFrom, dateTo])
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(count / 20)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit Log"
        description="Every marking action recorded with actor, timestamp, and IP"
      />

      {}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {ACTIONS.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by username…"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </CardBody>
      </Card>

      {error && <ErrorState description={error} onRetry={() => load(page)} />}
      {!error && !entries && <LoadingState message="Loading audit log…" />}
      {!error && entries && entries.length === 0 && <EmptyState title="No audit entries match the current filters." />}

      {!error && entries && entries.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {count} {count === 1 ? 'entry' : 'entries'}
            </p>
            {totalPages > 1 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
            )}
          </CardHeader>
          <CardBody>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOR[entry.action] ?? DEFAULT_COLOR}`}
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action_label}
                    </span>
                    {entry.candidate_number && (
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {entry.candidate_number}
                      </span>
                    )}
                    {entry.exam_title && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{entry.exam_title}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {entry.actor_username}
                    </span>
                    <span>{entry.actor_role}</span>
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                    {entry.ip_address && <span className="font-mono">{entry.ip_address}</span>}
                  </div>
                  {Object.keys(entry.detail).length > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {Object.entries(entry.detail)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
