import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { listQuizzes } from '@/services/quizzesService'
import type { ClassLevel, Subject } from '@/types/academics'
import type { Quiz } from '@/types/quiz'

export default function QuizzesPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setQuizzes(null)
    try {
      const [quizzesData, subjectsData, levelsData] = await Promise.all([
        listQuizzes(),
        listSubjects(),
        listClassLevels(),
      ])
      setQuizzes(quizzesData)
      setSubjects(subjectsData)
      setClassLevels(levelsData)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }
  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Quizzes" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !quizzes && <LoadingState message="Loading quizzes…" />}
      {!error && quizzes && quizzes.length === 0 && (
        <EmptyState title="No quizzes available yet." description="Check back once your teacher publishes one." />
      )}
      {!error && quizzes && quizzes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="cursor-pointer transition-colors duration-150 hover:border-blue-300"
              onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
            >
              <CardBody className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-500">
                  {subjectName(quiz.subject)} · {levelName(quiz.class_level)}
                </p>
                <p className="text-base font-semibold text-slate-900">{quiz.title}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
