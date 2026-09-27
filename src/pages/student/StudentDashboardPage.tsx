import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DownloadButton } from '@/components/offline/DownloadButton'
import { DownloadProgress } from '@/components/offline/DownloadProgress'
import { StorageUsage } from '@/components/offline/StorageUsage'
import { SyncStatus } from '@/components/offline/SyncStatus'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { db } from '@/db/db'
import { downloadLessonForOffline, isLessonDownloaded, removeLessonOffline } from '@/db/offlineServices/downloadService'
import { listSectionsForLesson } from '@/db/repositories/lessonSectionsRepository'
import { getLessonByServerId, listDownloadedLessons } from '@/db/repositories/lessonsRepository'
import { getSectionProgress } from '@/db/repositories/progressRepository'
import { useAuth } from '@/features/auth/AuthContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { listClassLevels, listSubjects } from '@/services/academicsService'
import { getApiErrorMessage } from '@/services/apiError'
import { getLessonStructure, listLessons } from '@/services/lessonsService'
import type { ClassLevel, Subject } from '@/types/academics'

interface DashboardLessonRow {
  lessonServerId: number
  title: string
  subjectId: number
  formId: number
  totalSections: number
  completedSections: number
  isDownloaded: boolean
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My Lessons" />

      <SyncStatus />
      <StorageUsage />

      {error && <ErrorState description={error} onRetry={load} />}
      {!error && !rows && <LoadingState message="Loading lessons…" />}
      {!error && rows && rows.length === 0 && (
        <EmptyState
          title={isOnline ? 'No lessons available yet.' : 'No downloaded lessons.'}
          description={
            isOnline
              ? 'Check back once your teacher publishes a lesson.'
              : "You're offline — download a lesson while online to study it later."
          }
        />
      )}
      {!error && rows && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const percentage = row.totalSections > 0 ? Math.round((row.completedSections / row.totalSections) * 100) : null
            const isDownloadingThis = downloadingId === row.lessonServerId
            return (
              <Card key={row.lessonServerId}>
                <CardBody className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {subjectName(row.subjectId)} · {levelName(row.formId)}
                    </p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900">{row.title}</p>
                  </div>
                  {percentage !== null ? (
                    <ProgressBar value={percentage} label="Progress" />
                  ) : (
                    <p className="text-sm text-slate-500">Single-page lesson</p>
                  )}
                  {isDownloadingThis && downloadProgress && (
                    <DownloadProgress completed={downloadProgress.completed} total={downloadProgress.total} />
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/lessons/${row.lessonServerId}`)}
                      disabled={!row.isDownloaded && !isOnline}
                    >
                      Continue Learning
                    </Button>
                    <DownloadButton
                      isDownloaded={row.isDownloaded}
                      isDownloading={isDownloadingThis}
                      disabled={!isOnline}
                      onDownload={() => handleDownload(row.lessonServerId)}
                      onRemove={() => handleRemove(row.lessonServerId)}
                    />
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
