import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { db } from '@/db/db'
import { isLessonDownloaded } from '@/db/offlineServices/downloadService'
import { listSectionsForLesson } from '@/db/repositories/lessonSectionsRepository'
import { listDownloadedLessons } from '@/db/repositories/lessonsRepository'
import { getSectionProgress } from '@/db/repositories/progressRepository'
import { StorageUsage } from '@/components/offline/StorageUsage'
import { SyncStatus } from '@/components/offline/SyncStatus'
import { WelcomeBanner } from '@/components/layout/WelcomeBanner'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { CheckIcon, DownloadIcon, JoinClassIcon, CalculatorIcon, BiologyIcon, ChemistryIcon, PhysicsIcon, LessonsIcon, LanguagesIcon, GeographyIcon, HistoryIcon, CivicsIcon, ComputerIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/AuthContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { getLessonStructure, listLessons } from '@/services/lessonsService'
import type { Subject } from '@/types/academics'
import { displayName } from '@/utils/displayName'

interface DashboardLessonRow {
  lessonServerId: number
  title: string
  subjectId: number
  formId: number
  totalSections: number
  completedSections: number
  isDownloaded: boolean
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()

  const [rows, setRows] = useState<DashboardLessonRow[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState<string | null>(null)


  async function load() {
    setError(null)
    setRows(null)
    try {
      if (isOnline) {
        const [lessons, subjectsData, levelsData] = await Promise.all([
          listLessons(),
          listSubjects(),
          listClassLevels(),
        ])
        setSubjects(subjectsData)
        // Opportunistic cache so the offline path below can still show
        // subject/level names, not just raw ids.
        await db.metadata.put({ key: 'cache.subjects', value: subjectsData })
        await db.metadata.put({ key: 'cache.classLevels', value: levelsData })

        const withProgress = await Promise.all(
          lessons.map(async (lesson) => {
            const structure = await getLessonStructure(lesson.id)
            const completedSections = structure.sections.filter((section) => section.status === 'COMPLETED').length
            return {
              lessonServerId: lesson.id,
              title: lesson.title,
              subjectId: lesson.subject,
              formId: lesson.class_level,
              totalSections: structure.sections.length,
              completedSections,
              isDownloaded: await isLessonDownloaded(lesson.id),
            }
          }),
        )
        setRows(withProgress)
      } else {
        const [cachedSubjects, _cachedLevels, downloadedLessons] = await Promise.all([
          db.metadata.get('cache.subjects'),
          db.metadata.get('cache.classLevels'),
          listDownloadedLessons(),
        ])
        setSubjects((cachedSubjects?.value as Subject[] | undefined) ?? [])

        const withProgress = await Promise.all(
          downloadedLessons.map(async (lesson) => {
            const sections = await listSectionsForLesson(lesson.id!)
            let completedSections = 0
            for (const section of sections) {
              const progress = user && (await getSectionProgress(user.id, section.id!))
              if (progress?.status === 'COMPLETED') completedSections += 1
            }
            return {
              lessonServerId: lesson.serverId,
              title: lesson.title,
              subjectId: lesson.subjectId,
              formId: lesson.formId,
              totalSections: sections.length,
              completedSections,
              isDownloaded: true,
            }
          }),
        )
        setRows(withProgress)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  useEffect(() => {
    load()
  }, [isOnline])

  function subjectName(subjectId: number) {
    return subjects.find((subject) => subject.id === subjectId)?.name ?? `#${subjectId}`
  }


  if (error) return <ErrorState description={error} onRetry={load} />
  if (!rows) return <LoadingState message="Loading your lessons…" />

  const withPercentage = rows.map((row) => ({
    ...row,
    percentage: row.totalSections > 0 ? Math.round((row.completedSections / row.totalSections) * 100) : null,
  }))

  // The lesson to feature at the top: prefer one already started but not
  // finished, otherwise fall back to the first available lesson.
  const inProgress = withPercentage.find((row) => row.percentage !== null && row.percentage > 0 && row.percentage < 100)
  const featured = inProgress ?? withPercentage[0]

  // A small, honest activity list built from real fetched state -- no
  // fabricated timestamps, since none are tracked client-side.
  const activity = [
    ...withPercentage
      .filter((row) => row.completedSections > 0)
      .map((row) => ({
        key: `progress-${row.lessonServerId}`,
        icon: CheckIcon,
        text: `Completed ${row.completedSections} of ${row.totalSections} sections in ${row.title}`,
      })),
    ...withPercentage
      .filter((row) => row.isDownloaded)
      .map((row) => ({
        key: `download-${row.lessonServerId}`,
        icon: DownloadIcon,
        text: `${row.title} downloaded for offline use`,
      })),
  ].slice(0, 4)

  const subjectStyles = [
    { match: ['math'], className: 'bg-[#0057FF] text-white', icon: CalculatorIcon },
    { match: ['bio'], className: 'bg-[#064E3B] text-white', icon: BiologyIcon },
    { match: ['chem'], className: 'bg-[#3A0CA3] text-white', icon: ChemistryIcon },
    { match: ['phys'], className: 'bg-[#5B3DF5] text-white', icon: PhysicsIcon },
    { match: ['english'], className: 'bg-[#E8DEFF] text-[#1E1033]', icon: LessonsIcon },
    { match: ['kiswahili', 'swahili'], className: 'bg-[#F8E7C9] text-[#1E1033]', icon: LanguagesIcon },
    { match: ['geograph'], className: 'bg-[#FFD6A5] text-[#1E1033]', icon: GeographyIcon },
    { match: ['history'], className: 'bg-[#FFF4D6] text-[#1E1033]', icon: HistoryIcon },
    { match: ['civic'], className: 'bg-[#1E1033] text-white', icon: CivicsIcon },
    { match: ['computer', 'ict'], className: 'bg-[#5B3DF5] text-white', icon: ComputerIcon },
  ]
  function subjectStyle(subject: Subject, index: number) {
    const found = subjectStyles.find((style) => style.match.some((word) => subject.name.toLowerCase().includes(word)))
    return found ?? { className: index % 2 ? 'bg-slate-800 text-white' : 'bg-blue-700 text-white', icon: LessonsIcon }
  }
  const subjectRows = subjects.map((subject, index) => {
    const subjectLessons = withPercentage.filter((row) => row.subjectId === subject.id)
    if (!subjectLessons.length) return null
    const total = subjectLessons.reduce((sum, row) => sum + row.totalSections, 0)
    const completed = subjectLessons.reduce((sum, row) => sum + row.completedSections, 0)
    return { subject, lessons: subjectLessons, total, completed, percentage: total ? Math.round(completed / total * 100) : 0, style: subjectStyle(subject, index) }
  }).filter(Boolean) as Array<{ subject: Subject; lessons: typeof withPercentage; total: number; completed: number; percentage: number; style: { className: string; icon: typeof LessonsIcon } }>

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        eyebrow="Student dashboard"
        title={`${greeting()}${user ? `, ${displayName(user)}` : ''} 👋`}
        description="Continue your learning journey."
        action={<Link to="/student/join-class" className="inline-flex items-center gap-2 rounded-lg border border-white/70 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><JoinClassIcon className="h-4 w-4" />Join a class</Link>}
      />
      <SyncStatus />
      {rows.length === 0 ? <EmptyState title={isOnline ? 'No lessons available yet.' : 'No downloaded lessons.'} description={isOnline ? 'Check back once your teacher publishes a lesson.' : "You're offline — download a lesson while online to study it later."} /> : <>
        {featured && <section><h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Continue Learning</h2><div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-blue-500/20 dark:bg-blue-500/10"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">{subjectName(featured.subjectId)}</p><p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{featured.title}</p>{featured.percentage !== null && <p className="mt-1 text-sm text-slate-500">Section {featured.completedSections + 1} of {featured.totalSections}</p>}</div><button type="button" onClick={() => navigate(`/student/lessons/${featured.lessonServerId}`)} className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:self-auto">Continue →</button></div></section>}
        <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Subjects</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a subject to see its lessons.</p></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{subjectRows.map(({ subject, lessons, total, completed, percentage, style }) => { const Icon = style.icon; return <Link key={subject.id} to={`/student/subjects/${subject.id}`} className={`group min-h-[205px] rounded-3xl p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${style.className}`}><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Icon className="h-6 w-6" /></span><span className="text-sm font-semibold opacity-90">{lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</span></div><h3 className="mt-8 text-2xl font-bold">{subject.name}</h3><p className="mt-1 text-sm opacity-80">{completed} of {total} sections completed</p><div className="mt-4"><div className="mb-1 flex justify-between text-xs font-medium"><span>Progress</span><span>{percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white/90" style={{ width: `${percentage}%` }} /></div></div><p className="mt-4 text-sm font-semibold">Continue {subject.name} <span className="inline-block transition-transform group-hover:translate-x-1">→</span></p></Link> })}</div></section>
        {activity.length > 0 && <section><h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2><ul className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">{activity.map((item) => <li key={item.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><item.icon className="h-4 w-4 shrink-0 text-green-600" />{item.text}</li>)}</ul></section>}
        <StorageUsage />
      </>}
    </div>
  )
}
