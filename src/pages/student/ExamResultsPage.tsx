import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/services/apiError'
import { listExamResults, listMyCandidateNumbers } from '@/services/examsService'
import { formatPercentage } from '@/utils/formatPercentage'
import type { ExamResult, StudentCandidateNumber } from '@/types/exam'

export default function ExamResultsPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<ExamResult[] | null>(null)
  const [candidateNumbers, setCandidateNumbers] = useState<StudentCandidateNumber[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setResults(null)
    setCandidateNumbers(null)
    try {
      const [myResults, myCandidateNumbers] = await Promise.all([listExamResults(), listMyCandidateNumbers()])
      setResults(myResults)
      setCandidateNumbers(myCandidateNumbers)
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
      {!error && (!results || !candidateNumbers) && <LoadingState message="Loading exam information…" />}
      {!error && candidateNumbers && candidateNumbers.length > 0 && (
        <Card>
          <CardHeader>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">My candidate numbers</p>
          </CardHeader>
          <CardBody>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {candidateNumbers.map((candidate) => (
                <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{candidate.exam_title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Academic year {candidate.academic_year}{candidate.exam_date ? ` · ${new Date(`${candidate.exam_date}T00:00:00`).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                    {candidate.candidate_number}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Keep your candidate number for this exam. Your teacher uses it to identify your script.</p>
          </CardBody>
        </Card>
      )}
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
