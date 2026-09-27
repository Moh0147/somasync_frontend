import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { getApiErrorMessage } from '@/services/apiError'
import { getQuiz, listMyAttempts } from '@/services/quizzesService'
import type { Quiz } from '@/types/quiz'
import type { StudentQuizAttempt } from '@/types/quizAttempt'

export default function QuizDetailPage() {
  const { quizId } = useParams()
  const id = Number(quizId)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<StudentQuizAttempt[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const [quizData, allAttempts] = await Promise.all([getQuiz(id), listMyAttempts()])
      setQuiz(quizData)
      setAttempts(allAttempts.filter((attempt) => attempt.quiz === id))
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!quiz) return <LoadingState message="Loading quiz…" />

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={quiz.title} description={quiz.description} />

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900">Details</p>
        </CardHeader>
        <CardBody>
          <DescriptionList items={[{ label: 'Description', value: quiz.description || '—' }]} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-slate-900">Your attempts</p>
        </CardHeader>
        <CardBody>
          {attempts.length === 0 && <EmptyState title="You haven't attempted this quiz yet." />}
          {attempts.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-600">{new Date(attempt.started_at).toLocaleString()}</span>
                  <span className="font-medium text-slate-900">
                    {attempt.percentage !== null ? `${attempt.percentage}%` : attempt.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <EmptyState
            title="Taking this quiz isn't available yet."
            description="The backend has no way for a student to safely fetch this quiz's questions before answering (unlike a lesson's mini-quiz). That needs a small backend addition before this screen can let you actually answer questions."
          />
        </CardBody>
      </Card>
    </div>
  )
}
