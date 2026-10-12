import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listScripts } from '@/services/markingService'
import type { ExamScript, ExamScriptStatus } from '@/types/exam'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'

const STATUS_BADGE: Record<ExamScriptStatus, StatusBadgeStatus> = {
  UPLOADED: 'pending',
  PROCESSING: 'syncing',
  MARKED: 'available',
  TEACHER_REVIEW: 'pending',
  FINALIZED: 'completed',
  PUBLISHED: 'completed',
  FAILED: 'failed',
}

const STATUS_LABEL: Record<ExamScriptStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Extracting',
  MARKED: 'Marked',
  TEACHER_REVIEW: 'Awaiting review',
  FINALIZED: 'Finalized',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
}

type TabStatus = 'ALL' | ExamScriptStatus

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UPLOADED', label: 'Uploaded' },
  { key: 'MARKED', label: 'Marked' },
  { key: 'TEACHER_REVIEW', label: 'In Review' },
  { key: 'FINALIZED', label: 'Finalized' },
  { key: 'FAILED', label: 'Failed' },
]

function defaultTab(role: string | undefined): TabStatus {
  if (role === 'EXAMINER') return 'UPLOADED'
  return 'ALL'
}

export default function MarkingScriptsPage() {
  const { user } = useAuth()
  const [scripts, setScripts] = useState<ExamScript[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabStatus>(() => defaultTab(user?.active_role ?? user?.role))

  async function load(status?: ExamScriptStatus) {
    setError(null)
    try {
      setScripts(await listScripts(status ? { status } : undefined))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load(activeTab === 'ALL' ? undefined : activeTab)
  }, [activeTab])

  function handleTab(tab: TabStatus) {
    setScripts(null)
    setActiveTab(tab)
  }

  const description =
    user?.role === 'EXAMINER'
      ? 'Scripts assigned to you'
      : 'All scripts for your school'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Scripts" description={description} />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTab(tab.key)}
            className={[
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <ErrorState description={error} onRetry={() => load(activeTab === 'ALL' ? undefined : activeTab)} />}
      {!error && !scripts && <LoadingState message="Loading scripts…" />}
      {!error && scripts && scripts.length === 0 && (
        <EmptyState title="No scripts in this category." />
      )}
      {!error && scripts && scripts.length > 0 && (
        <Card>
          <CardBody>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {scripts.map((script) => (
                <li key={script.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/marking/scripts/${script.id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                    >
                      {script.candidate_number || `Candidate #${script.candidate}`}
                    </Link>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      v{script.version} · {new Date(script.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={STATUS_BADGE[script.status]} label={STATUS_LABEL[script.status]} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
