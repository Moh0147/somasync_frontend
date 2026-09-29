import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Card, CardBody } from '@/components/ui/Card'
import { ChevronRightIcon, QuizzesIcon } from '@/components/ui/icons'
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
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quizzes</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Test your understanding after studying a topic.</p>
      </div>
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !quizzes && <LoadingState message="Loading quizzes…" />}
      {!error && quizzes && quizzes.length === 0 && (
        <EmptyState title="No quizzes available yet." description="Check back once your teacher publishes one." />
      )}
      {!error && quizzes && quizzes.length > 0 && (
        <div className="flex flex-col gap-2">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="cursor-pointer transition-colors duration-150 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => navigate(`/student/quizzes/${quiz.id}`)}
            >
              <CardBody className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <QuizzesIcon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {subjectName(quiz.subject)} · {levelName(quiz.class_level)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</p>
                </div>
                <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
