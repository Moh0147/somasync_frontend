import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ArrowRightIcon } from 'lucide-react'
import { LessonCard } from '@/features/student/LessonCard'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { getLessonStructure, listLessons } from '@/services/lessonsService'
import type { ClassLevel, Subject } from '@/types/academics'
import { isLessonDownloaded } from '@/db/offlineServices/downloadService'
import { useToast } from '@/components/feedback/Toast'

export default function SubjectPage() {
  const { subjectId } = useParams()
  const id = Number(subjectId)
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const { showToast } = useToast()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [levels, setLevels] = useState<ClassLevel[]>([])
  const [lessons, setLessons] = useState<Array<{ id: number; title: string; description: string; class_level: number; total: number; completed: number; downloaded: boolean }>>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [subjects, classLevels, allLessons] = await Promise.all([listSubjects(), listClassLevels(), listLessons()])
      const selected = subjects.find((item) => item.id === id)
      if (!selected) throw new Error('Subject not found.')
      setSubject(selected); setLevels(classLevels)
      const rows = await Promise.all(allLessons.filter((lesson) => lesson.subject === id).map(async (lesson) => {
        const structure = await getLessonStructure(lesson.id)
        return { id: lesson.id, title: lesson.title, description: lesson.description, class_level: lesson.class_level, total: structure.sections.length, completed: structure.sections.filter((section) => section.status === 'COMPLETED').length, downloaded: await isLessonDownloaded(lesson.id) }
      }))
      setLessons(rows)
    } catch (err) { setError(getApiErrorMessage(err)) }
  }
  useEffect(() => { load() }, [id])

  const progress = useMemo(() => { const total = lessons.reduce((sum, item) => sum + item.total, 0); const completed = lessons.reduce((sum, item) => sum + item.completed, 0); return { total, completed, percentage: total ? Math.round(completed / total * 100) : 0 } }, [lessons])
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!subject) return <LoadingState message="Loading subject…" />
  const levelName = (level: number) => levels.find((item) => item.id === level)?.name ?? `Form ${level}`

  return <div className="flex flex-col gap-6">
    <button type="button" onClick={() => navigate('/student')} className="self-start text-sm font-medium text-blue-600 hover:underline">← All subjects</button>
    <section className="relative isolate overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 shadow-sm sm:p-8 dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-teal-500/10">
      <div aria-hidden="true" className="absolute -right-10 -top-16 -z-10 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Subject workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{subject.name}</h1>
      <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_180px] sm:items-end"><div><ProgressBar value={progress.percentage} label="Overall progress" /><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{progress.completed} of {progress.total} sections completed</p></div><Button onClick={() => { const next = lessons.find((item) => item.completed < item.total) ?? lessons[0]; if (next) navigate(`/student/lessons/${next.id}`) }} disabled={!lessons.length}>Continue learning <ArrowRightIcon className="h-4 w-4" /></Button></div>
    </section>
    <div><h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your {subject.name} lessons</h2><p className="mt-1 text-sm text-slate-500">Only lessons from this subject are shown here.</p></div>
    {lessons.length === 0 ? <Card><CardBody><p className="text-sm text-slate-500">No lessons are available for this subject yet.</p></CardBody></Card> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{lessons.map((lesson) => { const percentage = lesson.total ? Math.round(lesson.completed / lesson.total * 100) : null; return <LessonCard key={lesson.id} title={lesson.title} subjectLabel={levelName(lesson.class_level)} percentage={percentage} isDownloaded={lesson.downloaded} isDownloading={false} downloadProgress={null} canOpen={lesson.downloaded || isOnline} isOnline={isOnline} onOpen={() => navigate(`/student/lessons/${lesson.id}`)} onDownload={() => showToast('info', 'Download from the dashboard.')} onRemove={() => undefined} /> })}</div>}
  </div>
}
