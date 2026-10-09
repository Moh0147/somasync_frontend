import { useEffect, useState } from 'react'

import { StorageUsage } from '@/components/offline/StorageUsage'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useToast } from '@/components/feedback/Toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { TrashIcon } from '@/components/ui/icons'
import { Card, CardBody } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getLessonStorageBytes, removeLessonOffline } from '@/db/offlineServices/downloadService'
import { listDownloadedLessons } from '@/db/repositories/lessonsRepository'
import { formatBytes } from '@/utils/formatBytes'

interface DownloadedLessonRow {
  localId: number
  title: string
  bytes: number
}

export default function StorageManagementPage() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<DownloadedLessonRow[] | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DownloadedLessonRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setRows(null)
    const lessons = await listDownloadedLessons()
    const withSizes = await Promise.all(
      lessons.map(async (lesson) => ({
        localId: lesson.id!,
        title: lesson.title,
        bytes: await getLessonStorageBytes(lesson.id!),
      })),
    )
    setRows(withSizes)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete() {
    if (!pendingDelete) return
    setIsDeleting(true)
    try {
      await removeLessonOffline(pendingDelete.localId)
      showToast('success', 'Download removed.')
      setPendingDelete(null)
      await load()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Storage" description="Manage lessons downloaded for offline use" />

      <Card>
        <CardBody>
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Storage Usage</p>
          <StorageUsage />
        </CardBody>
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Downloaded lessons</p>
        {!rows && <LoadingState message="Calculating storage…" />}
        {rows && rows.length === 0 && (
          <EmptyState
            title="No downloaded lessons."
            description="Download a lesson from your dashboard to study it offline."
          />
        )}
        {rows && rows.length > 0 && (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <Card key={row.localId}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(row.bytes)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(row)}>
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove download?"
        message={`"${pendingDelete?.title}" will be removed from this device. You can download it again later while online.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
