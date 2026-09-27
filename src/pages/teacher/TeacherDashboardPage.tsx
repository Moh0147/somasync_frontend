import { useEffect, useState } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { CheckIcon } from '@/components/ui/icons'
import { StatTile } from '@/components/ui/StatTile'
import { useAuth } from '@/features/auth/AuthContext'
import { getApiErrorMessage } from '@/services/apiError'
import { listMyClasses, listStudentsForClasses } from '@/services/classesService'
import type { SchoolClass } from '@/types/class'

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<SchoolClass[] | null>(null)
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setError(null)
    setClasses(null)
    setStudentCount(null)
    try {
      const myClasses = await listMyClasses(user.id)
      setClasses(myClasses)
      const students = await listStudentsForClasses(myClasses)
      setStudentCount(new Set(students.map((entry) => entry.student.id)).size)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [user])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Dashboard" description="Your classes at a glance" />
      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !classes && <LoadingState message="Loading your classes…" />}
      {!error && classes && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatTile
              icon={<CheckIcon className="h-5 w-5" />}
              label="My Classes"
              value={String(classes.length)}
              tone="primary"
            />
            <StatTile
              icon={<CheckIcon className="h-5 w-5" />}
              label="My Students"
              value={studentCount === null ? '…' : String(studentCount)}
              tone="secondary"
            />
          </div>
          <p className="text-sm text-slate-500">
            Lesson, quiz, and exam metrics will appear here once those features are built.
          </p>
        </>
      )}
    </div>
  )
}
