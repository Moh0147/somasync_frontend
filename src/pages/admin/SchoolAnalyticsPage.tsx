import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { BarChart } from '@/components/ui/BarChart'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatTile } from '@/components/ui/StatTile'
import { CheckIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/services/apiError'
import { getSchoolClassPerformance, getSchoolOverview, getSchoolSubjectPerformance } from '@/services/analyticsService'
import { listExams } from '@/services/examsService'
import { listLessons } from '@/services/lessonsService'
import type { ClassPerformance, SchoolOverview, SubjectPerformance } from '@/types/analytics'

export default function SchoolAnalyticsPage() {
  const [overview, setOverview] = useState<SchoolOverview | null>(null)
  const [classes, setClasses] = useState<ClassPerformance[] | null>(null)
  const [subjects, setSubjects] = useState<SubjectPerformance[] | null>(null)
  const [lessonCount, setLessonCount] = useState<number | null>(null)
  const [examCount, setExamCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const [overviewData, classesData, subjectsData, lessons, exams] = await Promise.all([
        getSchoolOverview(),
        getSchoolClassPerformance(),
        getSchoolSubjectPerformance(),
        listLessons(),
        listExams(),
      ])
      setOverview(overviewData)
      setClasses(classesData)
      setSubjects(subjectsData)
      setLessonCount(lessons.length)
      setExamCount(exams.length)
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) return <ErrorState description={error} onRetry={load} />
  if (!overview || !classes || !subjects || lessonCount === null || examCount === null) {
    return <LoadingState message="Loading analytics…" />
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Analytics" description={overview.school_name} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Students" value={String(overview.student_count)} tone="primary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Teachers" value={String(overview.teacher_count)} tone="secondary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Classes" value={String(overview.class_count)} tone="primary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Subjects" value={String(overview.subject_count)} tone="secondary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Lessons" value={String(lessonCount)} tone="primary" />
        <StatTile icon={<CheckIcon className="h-5 w-5" />} label="Exams" value={String(examCount)} tone="primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProgressBar value={overview.avg_quiz_percentage ?? 0} label="Avg quiz %" />
        <ProgressBar value={overview.avg_exam_percentage ?? 0} label="Avg exam %" />
        <ProgressBar value={overview.lesson_completion_rate ?? 0} label="Lesson completion rate" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">School performance by class</h2>
        {classes.length === 0 ? (
          <EmptyState title="No classes yet." />
        ) : (
          <BarChart
            items={classes.map((c) => ({ label: c.class_name, value: c.avg_quiz_percentage ?? 0 }))}
            valueFormatter={(v) => `${v}%`}
          />
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">School performance by subject</h2>
        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet." />
        ) : (
          <BarChart
            items={subjects.map((s) => ({ label: s.name, value: s.avg_quiz_percentage ?? 0 }))}
            valueFormatter={(v) => `${v}%`}
          />
        )}
      </div>
    </div>
  )
}
