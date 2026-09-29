import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Card, CardBody } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getApiErrorMessage } from '@/services/apiError'
import { getExamResult } from '@/services/examsService'
import type { ExamResult } from '@/types/exam'

export default function ExamResultDetailPage() {
  const { resultId } = useParams()
  const id = Number(resultId)

  const [result, setResult] = useState<ExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      setResult(await getExamResult(id))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!result) return <LoadingState message="Loading result…" />

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{result.exam_title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Candidate {result.candidate_number}</p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {result.score} / {result.total_marks}
          </p>
          <ProgressBar value={result.percentage ?? 0} label="Score" />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-1">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Question breakdown</p>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.answers.map((answer) => (
              <li key={answer.id} className="flex flex-col gap-1 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Q{answer.question_number}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {answer.teacher_final_marks ?? '—'}/{answer.max_marks}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{answer.question_text}</p>
                {answer.teacher_comment && <p className="text-slate-500 dark:text-slate-400">{answer.teacher_comment}</p>}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
