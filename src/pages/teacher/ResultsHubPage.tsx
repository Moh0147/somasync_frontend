import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/feedback/Toast'
import { getApiErrorMessage } from '@/services/apiError'
import { bulkPublishExamResults, listExams, listScripts } from '@/services/examsService'
import type { Exam, ExamScript } from '@/types/exam'

interface ReadyExam {
  exam: Exam
  finalizedCount: number
  totalScripts: number
}

export default function ResultsHubPage() {
  const { showToast } = useToast()
  const [readyExams, setReadyExams] = useState<ReadyExam[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setReadyExams(null)
    setSelected(new Set())
    try {
      const exams = await listExams()
      const markingExams = exams.filter(
        (e) => e.status === 'MARKING' || e.status === 'REVIEW' || e.status === 'FINALIZED',
      )
      const withCounts = await Promise.all(
        markingExams.map(async (exam): Promise<ReadyExam | null> => {
          try {
            const scripts = await listScripts(exam.id)
            const finalizedCount = scripts.filter((s: ExamScript) => s.status === 'FINALIZED').length
            if (finalizedCount === 0) return null
            return { exam, finalizedCount, totalScripts: scripts.length }
          } catch {
            return null
          }
        }),
      )
      setReadyExams(withCounts.filter((r): r is ReadyExam => r !== null))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => { load() }, [])

  function toggleAll() {
    if (!readyExams) return
    if (selected.size === readyExams.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(readyExams.map((r) => r.exam.id)))
    }
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handlePublish() {
    if (selected.size === 0) return
    setIsPublishing(true)
    try {
      const result = await bulkPublishExamResults([...selected])
      showToast('success', `Published results for ${result.published_exams.length} exam(s) — ${result.total_published} script(s).`)
      await load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  const allSelected = !!readyExams?.length && selected.size === readyExams.length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Results Hub"
        description="Hold marked results here and publish them all at once when ready."
        actions={
          selected.size > 0 ? (
            <Button size="sm" disabled={isPublishing} onClick={handlePublish}>
              {isPublishing ? 'Publishing…' : `Publish ${selected.size} exam${selected.size !== 1 ? 's' : ''} →`}
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorState description={error} onRetry={load} />}

      {!error && readyExams === null && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {!error && readyExams !== null && readyExams.length === 0 && (
        <EmptyState
          title="Hakuna matokeo yanayosubiri."
          description="Scripts zilizofinalishwa zitaonekana hapa ukifika wakati wa kuzichapisha."
        />
      )}

      {!error && readyExams !== null && readyExams.length > 0 && (
        <>
          {}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              {allSelected ? 'Deselect all' : 'Select all'}
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {readyExams.length} exam{readyExams.length !== 1 ? 's' : ''} with finalized scripts
            </span>
          </div>

          {}
          <div className="flex flex-col gap-3">
            {readyExams.map(({ exam, finalizedCount, totalScripts }) => (
              <label
                key={exam.id}
                className={[
                  'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition',
                  selected.has(exam.id)
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={selected.has(exam.id)}
                  onChange={() => toggle(exam.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {exam.academic_year}
                    {exam.exam_date ? ` · ${exam.exam_date}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
                      {finalizedCount} finalized
                    </span>
                    {totalScripts - finalizedCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        {totalScripts - finalizedCount} still pending
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/teacher/exams/${exam.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  View exam
                </Link>
              </label>
            ))}
          </div>

          {}
          {selected.size > 0 && (
            <div className="sticky bottom-4 z-20 overflow-hidden rounded-xl border border-blue-200 bg-white/95 shadow-lg backdrop-blur dark:border-blue-500/30 dark:bg-slate-900/95">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {selected.size} exam{selected.size !== 1 ? 's' : ''} selected
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Publish results to students
                  </p>
                </div>
                <Button disabled={isPublishing} onClick={handlePublish}>
                  {isPublishing ? 'Publishing…' : `Publish ${selected.size} exam${selected.size !== 1 ? 's' : ''} →`}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
