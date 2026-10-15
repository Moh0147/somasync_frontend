import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ExamAnswerReviewCard } from '@/features/exams/ExamAnswerReviewCard'
import { ScriptPagesViewer } from '@/features/exams/ScriptPagesViewer'
import { getApiErrorMessage } from '@/services/apiError'
import {
  aiMarkScript,
  markAnswer,
  ocrScript,
  finalizeScript,
  getExam,
  getScript,
  listAttempts,
  listExamQuestions,
  submitScriptForReview,
} from '@/services/examsService'
import type { Exam, ExamQuestion, ExamScript, StudentExamAttempt } from '@/types/exam'

const scriptStatusMap: Record<string, StatusBadgeStatus> = {
  UPLOADED: 'pending',
  PROCESSING: 'syncing',
  MARKED: 'available',
  TEACHER_REVIEW: 'pending',
  FINALIZED: 'completed',
  PUBLISHED: 'completed',
  FAILED: 'failed',
}

const scriptStatusLabel: Record<string, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  MARKED: 'AI-marked',
  TEACHER_REVIEW: 'Awaiting review',
  FINALIZED: 'Finalized',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
}

export default function ScriptReviewPage() {
  const { examId, scriptId } = useParams()
  const examIdNum = Number(examId)
  const scriptIdNum = Number(scriptId)
  const { showToast } = useToast()

  const [exam, setExam] = useState<Exam | null>(null)
  const [script, setScript] = useState<ExamScript | null>(null)
  const [attempt, setAttempt] = useState<StudentExamAttempt | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [error, setError] = useState<string | null>(null)

  const [isRunningAi, setIsRunningAi] = useState(false)
  const [isRunningOcr, setIsRunningOcr] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isAcceptingAll, setIsAcceptingAll] = useState(false)
  const [mobileTab, setMobileTab] = useState<'script' | 'answers'>('answers')

  async function load() {
    setError(null)
    try {
      const [examData, scriptData, attempts, questionsData] = await Promise.all([
        getExam(examIdNum),
        getScript(scriptIdNum),
        listAttempts(examIdNum),
        listExamQuestions(examIdNum),
      ])
      setExam(examData)
      setScript(scriptData)
      setQuestions(questionsData)
      setAttempt(attempts.find((a) => a.current_script === scriptIdNum) ?? null)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [examIdNum, scriptIdNum])

  async function handleRunOcr() {
    setIsRunningOcr(true)
    try {
      const updated = await ocrScript(scriptIdNum)
      setScript(updated)
      showToast('success', 'Text extraction complete. Please review the detected answers.')
      await load()
    } catch (err) { showToast('error', getApiErrorMessage(err)) }
    finally { setIsRunningOcr(false) }
  }

  async function handleRunAiMarking() {
    setIsRunningAi(true)
    try {
      const updated = await aiMarkScript(scriptIdNum)
      setScript(updated)
      showToast(updated.status === 'FAILED' ? 'error' : 'success', updated.status === 'FAILED' ? updated.marking_error : 'AI marking complete.')
      await load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsRunningAi(false)
    }
  }

  async function handleSubmitForReview() {
    setIsSubmittingReview(true)
    try {
      const updated = await submitScriptForReview(scriptIdNum)
      setScript(updated)
      showToast('success', 'Submitted for teacher review.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsSubmittingReview(false)
    }
  }

  async function handleFinalize() {
    setIsFinalizing(true)
    try {
      const updated = await finalizeScript(scriptIdNum)
      setScript(updated)
      showToast('success', 'Script finalized.')
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsFinalizing(false)
    }
  }

  async function handleAcceptAll() {
    if (!attempt) return
    const pending = attempt.answers.filter(
      (a) => a.ai_marks_awarded !== null && a.teacher_final_marks === null,
    )
    if (pending.length === 0) return
    setIsAcceptingAll(true)
    try {
      await Promise.all(
        pending.map((a) =>
          markAnswer(a.id, { teacher_final_marks: a.ai_marks_awarded!, teacher_comment: a.ai_feedback }),
        ),
      )
      showToast('success', `${pending.length} AI mark${pending.length > 1 ? 's' : ''} accepted.`)
      await load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setIsAcceptingAll(false)
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!exam || !script) return <LoadingState message="Loading script…" />

  const sectionSettings = exam?.section_settings ?? {}

  
  
  const isFinishedStatuses = script.status === 'FINALIZED' || script.status === 'PUBLISHED'

  const missingCompulsory = attempt
    ? attempt.answers.filter((a) => {
        const q = questions.find((q) => q.id === a.exam_question)
        if (!q) return false
        const inChoiceSection = Boolean(q.section && sectionSettings[q.section])
        const effectivelyOptional = inChoiceSection || !q.is_compulsory
        return !effectivelyOptional && !(a.recorded_answer || '').trim() && a.teacher_final_marks === null
      })
    : []
  const canFinalize = !isFinishedStatuses && missingCompulsory.length === 0

  const extractionStatus =
    script.ocr_status === 'READY'
      ? 'Extracted — ready for review'
      : script.ocr_status === 'FAILED'
        ? (script.ocr_error || 'Extraction failed — try again')
        : script.ocr_status === 'PROCESSING'
          ? 'Extracting…'
          : 'Not yet extracted'
  const showExtractBtn  = !isFinishedStatuses
  const showAiMarkBtn   = !isFinishedStatuses
  const showReviewBtn   = false  
  const showFinalizeBtn = !isFinishedStatuses

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: 'Exams', href: '/teacher/exams' }, { label: exam.title, href: `/teacher/exams/${examIdNum}` }, { label: script.file_name }]} />

      {}
      <div className="flex flex-col gap-2">
        {}
        <div className="flex min-w-0 items-start gap-2">
          <h1 className="min-w-0 flex-1 truncate text-xl font-semibold text-slate-900 dark:text-slate-100">
            {script.file_name}
          </h1>
          <div className="shrink-0 pt-0.5">
            <StatusBadge status={scriptStatusMap[script.status] ?? 'pending'} label={scriptStatusLabel[script.status] ?? script.status} />
          </div>
        </div>

        {}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          v{script.version} · {extractionStatus}
        </p>

        {}
        {(showExtractBtn || showAiMarkBtn || showReviewBtn || showFinalizeBtn) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {showExtractBtn && (
              <Button
                size="sm"
                variant={script.ocr_status === 'PROCESSING' && !isRunningOcr ? 'secondary' : 'ghost'}
                disabled={isRunningOcr}
                onClick={handleRunOcr}
              >
                {isRunningOcr
                  ? 'Extracting…'
                  : script.ocr_status === 'PROCESSING'
                    ? 'Stuck — Reset & retry'
                    : 'Extract answers'}
              </Button>
            )}
            {showAiMarkBtn && (
              <Button size="sm" variant="secondary" disabled={isRunningAi || isRunningOcr || script.ocr_status === 'PROCESSING'} onClick={handleRunAiMarking}>
                {isRunningAi ? 'Marking…' : 'AI marking'}
              </Button>
            )}
            {showReviewBtn && (
              <Button size="sm" disabled={isSubmittingReview} onClick={handleSubmitForReview}>
                {isSubmittingReview ? 'Submitting…' : 'Submit for review'}
              </Button>
            )}
            {showFinalizeBtn && (
              <Button size="sm" disabled={isFinalizing || !canFinalize} onClick={handleFinalize}>
                {isFinalizing ? 'Finalizing…' : 'Finalize'}
              </Button>
            )}
          </div>
        )}
      </div>

      {}
      {isFinishedStatuses && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-500/30 dark:bg-green-500/10">
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              Script {script.status === 'PUBLISHED' ? 'published' : 'finalized'} ✓
            </p>
            <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
              When all scripts are ready, publish results to students from Results Hub.
            </p>
          </div>
          <Link to="/teacher/results">
            <Button size="sm">
              Results Hub →
            </Button>
          </Link>
        </div>
      )}

      {}
      {missingCompulsory.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {missingCompulsory.length} compulsory question{missingCompulsory.length > 1 ? 's were' : ' was'} not found in the script.
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Go to the highlighted question{missingCompulsory.length > 1 ? 's' : ''} and enter the student's answer manually (or 0 if truly blank). Finalize is blocked until all compulsory questions are marked.
          </p>
        </div>
      )}
      {script.marking_error && (
        <p className="text-sm text-red-600 dark:text-red-400">{script.marking_error}</p>
      )}

      {/* ── Mobile tab switcher (hidden on lg+) ────────────────── */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 lg:hidden dark:border-slate-800 dark:bg-slate-800/40">
        {(['script', 'answers'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={[
              'flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors',
              mobileTab === tab
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ].join(' ')}
          >
            {tab === 'script' ? `Script (${script.pages?.length ?? 0}p)` : `Answers (${attempt?.answers.length ?? 0})`}
          </button>
        ))}
      </div>

      {/* ── Stacked layout: image top, answers bottom ─────────── */}
      <div className="flex flex-col gap-6">
        {/* Script pages — hidden on mobile when answers tab is active */}
        <div className={[mobileTab === 'answers' ? 'lg:block hidden' : '', 'lg:max-w-2xl'].join(' ')}>
          <ScriptPagesViewer pages={script.pages ?? []} />
        </div>

        {/* Answer cards — hidden on mobile when script tab is active */}
        <div className={['flex flex-col gap-4', mobileTab === 'script' ? 'lg:flex hidden' : ''].join(' ')}>
          {attempt && (() => {
            const pendingAi = attempt.answers.filter(
              (a) => a.ai_marks_awarded !== null && a.teacher_final_marks === null,
            )
            if (pendingAi.length === 0) return null
            return (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {pendingAi.length} AI suggestion{pendingAi.length > 1 ? 's' : ''} awaiting your approval
                </p>
                <Button size="sm" disabled={isAcceptingAll} onClick={handleAcceptAll}>
                  {isAcceptingAll ? 'Accepting…' : 'Accept All AI Marks'}
                </Button>
              </div>
            )
          })()}
          {!attempt && <EmptyState title="No attempt found for this script yet." />}
          {attempt && (() => {
            const sorted = attempt.answers
              .slice()
              .sort((a, b) => {
                const qa = questions.find((q) => q.id === a.exam_question)
                const qb = questions.find((q) => q.id === b.exam_question)
                if (qa?.section && qb?.section && qa.section !== qb.section)
                  return qa.section.localeCompare(qb.section)
                return a.exam_question - b.exam_question
              })

            // Group by section when sections are defined
            const hasSections = sorted.some((a) => {
              const q = questions.find((qq) => qq.id === a.exam_question)
              return Boolean(q?.section)
            })

            if (!hasSections) {
              return sorted.map((answer) => {
                const question = questions.find((q) => q.id === answer.exam_question)
                if (!question) return null
                return <ExamAnswerReviewCard key={answer.id} answer={answer} question={question} sectionSettings={sectionSettings} onChanged={load} />
              })
            }

            // Build ordered section groups
            const sections: string[] = []
            const groups: Record<string, typeof sorted> = {}
            for (const answer of sorted) {
              const q = questions.find((qq) => qq.id === answer.exam_question)
              const sec = q?.section || 'Other'
              if (!groups[sec]) { groups[sec] = []; sections.push(sec) }
              groups[sec].push(answer)
            }

            return sections.map((sec) => {
              const secAnswers = groups[sec]
              const secMarks = secAnswers.reduce((sum, a) => {
                const q = questions.find((qq) => qq.id === a.exam_question)
                return sum + (q ? Number(q.max_marks) : 0)
              }, 0)
              return (
                <div key={sec} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {sec} · {secMarks} marks
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                  {secAnswers.map((answer) => {
                    const question = questions.find((q) => q.id === answer.exam_question)
                    if (!question) return null
                    return <ExamAnswerReviewCard key={answer.id} answer={answer} question={question} sectionSettings={sectionSettings} onChanged={load} />
                  })}
                </div>
              )
            })
          })()}
        </div>
      </div>
    </div>
  )
}
