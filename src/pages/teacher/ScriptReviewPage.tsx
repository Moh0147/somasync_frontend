import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Button } from '@/components/ui/Button'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ExamAnswerReviewCard } from '@/features/exams/ExamAnswerReviewCard'
import { getApiErrorMessage } from '@/services/apiError'
import {
  aiMarkScript,
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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

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

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!exam || !script) return <LoadingState message="Loading script…" />

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: 'Exams', href: '/teacher/exams' }, { label: exam.title, href: `/teacher/exams/${examIdNum}` }, { label: script.file_name }]} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{script.file_name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">v{script.version}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={scriptStatusMap[script.status] ?? 'pending'} label={scriptStatusLabel[script.status] ?? script.status} />
          {(script.status === 'UPLOADED' || script.status === 'FAILED') && (
            <Button size="sm" variant="secondary" disabled={isRunningAi} onClick={handleRunAiMarking}>
              {isRunningAi ? 'Running…' : 'Run AI Marking'}
            </Button>
          )}
          {(script.status === 'UPLOADED' || script.status === 'MARKED' || script.status === 'FAILED') && (
            <Button size="sm" disabled={isSubmittingReview} onClick={handleSubmitForReview}>
              Submit for Review
            </Button>
          )}
          {script.status === 'TEACHER_REVIEW' && (
            <Button size="sm" disabled={isFinalizing} onClick={handleFinalize}>
              Finalize
            </Button>
          )}
        </div>
      </div>

      {script.marking_error && <p className="text-sm text-red-600 dark:text-red-400">{script.marking_error}</p>}

      {!attempt && <EmptyState title="No attempt found for this script yet." />}
      {attempt &&
        attempt.answers
          .slice()
          .sort((a, b) => a.exam_question - b.exam_question)
          .map((answer) => {
            const question = questions.find((q) => q.id === answer.exam_question)
            if (!question) return null
            return <ExamAnswerReviewCard key={answer.id} answer={answer} question={question} onChanged={load} />
          })}
    </div>
  )
}
