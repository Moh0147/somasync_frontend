import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { WelcomeBanner } from '@/components/layout/WelcomeBanner'
import { Card, CardBody } from '@/components/ui/Card'
import { ArrowRightIcon, ExamsIcon, LessonsIcon, QuizzesIcon, StudentsIcon, UploadIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { getTeacherClassPerformance, getTeacherExamPerformance } from '@/services/analyticsService'
import { getApiErrorMessage } from '@/services/apiError'
import type { ClassPerformance } from '@/types/analytics'
import { displayName } from '@/utils/displayName'
import { formatPercentage } from '@/utils/formatPercentage'

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

  const classGridColumns = classes.length === 3
    ? 'grid-cols-1 md:grid-cols-3'
    : classes.length === 2 || classes.length === 4
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1'

  return (
    <div className="flex flex-col gap-8">
      <WelcomeBanner eyebrow="Teacher dashboard" title={`${greeting()}${user ? `, ${displayName(user)}` : ''} 👋`} description="Here's what's happening in your classes. Pick up where you left off." />

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">At a glance</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Your classes</h2>
          </div>
          {classes.length > 0 && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span>}
        </div>
        {classes.length === 0 ? (
          <EmptyState title="No classes assigned yet." description="Your school administrator assigns you to classes." />
        ) : (
          <div className={`grid ${classGridColumns} gap-3`}>
            {classes.map((schoolClass) => (
              <Card key={schoolClass.class_id} className="group relative overflow-hidden rounded-xl transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 dark:hover:border-blue-800">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-teal-400 opacity-70 transition-opacity group-hover:opacity-100" />
                <CardBody className="flex min-h-32 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100">{schoolClass.class_name}</p>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{schoolClass.student_count}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {schoolClass.student_count} student{schoolClass.student_count === 1 ? '' : 's'}
                  </p>
                  {schoolClass.avg_quiz_percentage !== null && (
                    <div className="mt-auto pt-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Average quiz score</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400">{formatPercentage(schoolClass.avg_quiz_percentage)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-500" style={{ width: `${Math.max(0, Math.min(100, schoolClass.avg_quiz_percentage))}%` }} /></div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Get things done</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-500/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition duration-200 group-hover:scale-110 group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500/20">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{action.label}</span>
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
