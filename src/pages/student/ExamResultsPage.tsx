import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/services/apiError'
import { listExamResults } from '@/services/examsService'
import { formatPercentage } from '@/utils/formatPercentage'
import type { ExamResult } from '@/types/exam'

export default function ExamResultsPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<ExamResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setResults(null)
    try {
      setResults(await listExamResults())
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Exam Results" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !results && <LoadingState message="Loading results…" />}
      {!error && results && results.length === 0 && (
        <EmptyState title="No published results yet." description="Results appear here once your teacher publishes them." />
      )}
      {!error && results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Card
              key={result.id}
              className="cursor-pointer transition-colors duration-150 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => navigate(`/student/results/${result.id}`)}
            >
              <CardBody className="flex flex-col gap-1">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{result.exam_title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {result.score} / {result.total_marks} ({formatPercentage(result.percentage)})
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
