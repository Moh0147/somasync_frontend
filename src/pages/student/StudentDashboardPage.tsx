import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { StorageUsage } from '@/components/offline/StorageUsage'
import { SyncStatus } from '@/components/offline/SyncStatus'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { CheckIcon, DownloadIcon, JoinClassIcon } from '@/components/ui/icons'
import { db } from '@/db/db'
import { downloadLessonForOffline, isLessonDownloaded, removeLessonOffline } from '@/db/offlineServices/downloadService'
import { listSectionsForLesson } from '@/db/repositories/lessonSectionsRepository'
import { getLessonByServerId, listDownloadedLessons } from '@/db/repositories/lessonsRepository'
import { getSectionProgress } from '@/db/repositories/progressRepository'
import { useAuth } from '@/features/auth/AuthContext'
import { LessonCard } from '@/features/student/LessonCard'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { getLessonStructure, listLessons } from '@/services/lessonsService'
import type { ClassLevel, Subject } from '@/types/academics'
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
  const { showToast } = useToast()
  const isOnline = useOnlineStatus()

  const [rows, setRows] = useState<DashboardLessonRow[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([])
  const [error, setError] = useState<string | null>(null)

  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ completed: number; total: number } | null>(null)

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
        setClassLevels(levelsData)
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
        const [cachedSubjects, cachedLevels, downloadedLessons] = await Promise.all([
          db.metadata.get('cache.subjects'),
          db.metadata.get('cache.classLevels'),
          listDownloadedLessons(),
        ])
        setSubjects((cachedSubjects?.value as Subject[] | undefined) ?? [])
        setClassLevels((cachedLevels?.value as ClassLevel[] | undefined) ?? [])

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
  function levelName(levelId: number) {
    return classLevels.find((level) => level.id === levelId)?.name ?? `#${levelId}`
  }

  async function handleDownload(lessonServerId: number) {
    setDownloadingId(lessonServerId)
    setDownloadProgress({ completed: 0, total: 1 })
    try {
      await downloadLessonForOffline(lessonServerId, (update) => setDownloadProgress(update))
      showToast('success', 'Lesson downloaded for offline use.')
      await load()
    } catch (err) {
      showToast('error', getApiErrorMessage(err))
    } finally {
      setDownloadingId(null)
      setDownloadProgress(null)
    }
  }

  async function handleRemove(lessonServerId: number) {
    const local = await getLessonByServerId(lessonServerId)
    if (!local) return
    await removeLessonOffline(local.id!)
    showToast('success', 'Download removed.')
    await load()
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {greeting()}
            {user ? `, ${displayName(user)}` : ''} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Continue your learning journey.</p>
        </div>
        <Link
          to="/student/join-class"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors duration-150 hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
        >
          <JoinClassIcon aria-hidden="true" className="h-3.5 w-3.5" />
          Join a class
        </Link>
      </div>

      <SyncStatus />

      {rows.length === 0 ? (
        <EmptyState
          title={isOnline ? 'No lessons available yet.' : 'No downloaded lessons.'}
          description={
            isOnline
              ? 'Check back once your teacher publishes a lesson.'
              : "You're offline — download a lesson while online to study it later."
          }
        />
      ) : (
        <>
          {featured && (
            <LessonCard
              variant="featured"
              title={featured.title}
              subjectLabel={`${subjectName(featured.subjectId)} • ${levelName(featured.formId)}`}
              percentage={featured.percentage}
              isDownloaded={featured.isDownloaded}
              isDownloading={downloadingId === featured.lessonServerId}
              downloadProgress={downloadingId === featured.lessonServerId ? downloadProgress : null}
              canOpen={featured.isDownloaded || isOnline}
              isOnline={isOnline}
              onOpen={() => navigate(`/student/lessons/${featured.lessonServerId}`)}
              onDownload={() => handleDownload(featured.lessonServerId)}
              onRemove={() => handleRemove(featured.lessonServerId)}
            />
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Your Learning</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {withPercentage.map((row) => (
                <LessonCard
                  key={row.lessonServerId}
                  title={row.title}
                  subjectLabel={`${subjectName(row.subjectId)} • ${levelName(row.formId)}`}
                  percentage={row.percentage}
                  isDownloaded={row.isDownloaded}
                  isDownloading={downloadingId === row.lessonServerId}
                  downloadProgress={downloadingId === row.lessonServerId ? downloadProgress : null}
                  canOpen={row.isDownloaded || isOnline}
                  isOnline={isOnline}
                  onOpen={() => navigate(`/student/lessons/${row.lessonServerId}`)}
                  onDownload={() => handleDownload(row.lessonServerId)}
                  onRemove={() => handleRemove(row.lessonServerId)}
                />
              ))}
            </div>
          </div>

          {activity.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
              <ul className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                {activity.map((item) => (
                  <li key={item.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <item.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <StorageUsage />
        </>
      )}
    </div>
  )
}
