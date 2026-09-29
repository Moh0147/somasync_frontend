import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Card, CardBody } from '@/components/ui/Card'
import { ArrowRightIcon, ExamsIcon, LessonsIcon, QuizzesIcon, StudentsIcon, UploadIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { getTeacherClassPerformance, getTeacherExamPerformance } from '@/services/analyticsService'
import { getApiErrorMessage } from '@/services/apiError'
import type { ClassPerformance } from '@/types/analytics'
import { displayName } from '@/utils/displayName'

const quickActions = [
  { to: '/teacher/lessons', label: 'Create Lesson', icon: LessonsIcon },
  { to: '/teacher/quizzes', label: 'Create Quiz', icon: QuizzesIcon },
  { to: '/teacher/exams', label: 'Upload Exam Script', icon: UploadIcon },
  { to: '/teacher/students', label: 'View Students', icon: StudentsIcon },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassPerformance[] | null>(null)
  const [examCount, setExamCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    setClasses(null)
    try {
      const [classPerformance, exams] = await Promise.all([getTeacherClassPerformance(), getTeacherExamPerformance()])
      setClasses(classPerformance)
      setExamCount(exams.length)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [user])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!classes) return <LoadingState message="Loading your classes…" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {greeting()}
          {user ? `, ${displayName(user)}` : ''} 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Here's what's happening in your classes.</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Your classes</h2>
        {classes.length === 0 ? (
          <EmptyState title="No classes assigned yet." description="Your school administrator assigns you to classes." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((schoolClass) => (
              <Card key={schoolClass.class_id}>
                <CardBody className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{schoolClass.class_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {schoolClass.student_count} student{schoolClass.student_count === 1 ? '' : 's'}
                  </p>
                  {schoolClass.avg_quiz_percentage !== null && (
                    <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                      {schoolClass.avg_quiz_percentage}% average quiz score
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex flex-col items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-4 text-center transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-500/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {examCount !== null && examCount > 0 && (
        <Link
          to="/teacher/exams"
          className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <ExamsIcon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {examCount} exam{examCount === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review candidates, scripts, and marking</p>
            </div>
          </div>
          <ArrowRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
        </Link>
      )}
    </div>
  )
}
