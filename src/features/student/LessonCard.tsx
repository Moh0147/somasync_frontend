import { DownloadButton } from '@/components/offline/DownloadButton'
import { DownloadProgress } from '@/components/offline/DownloadProgress'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ArrowRightIcon, LessonsIcon } from '@/components/ui/icons'

interface LessonCardProps {
  title: string
  subjectLabel: string
  percentage: number | null
  isDownloaded: boolean
  isDownloading: boolean
  downloadProgress: { completed: number; total: number } | null
  canOpen: boolean
  isOnline: boolean
  onOpen: () => void
  onDownload: () => void
  onRemove: () => void
  /** 'featured' is the single "continue learning" hero card; 'default' is used in the grid. */
  variant?: 'default' | 'featured'
}

export function LessonCard({
  title,
  subjectLabel,
  percentage,
  isDownloaded,
  isDownloading,
  downloadProgress,
  canOpen,
  isOnline,
  onOpen,
  onDownload,
  onRemove,
  variant = 'default',
}: LessonCardProps) {
  if (variant === 'featured') {
    return (
      <Card className="border-blue-200 bg-blue-50/40 dark:border-blue-500/20 dark:bg-blue-500/5">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
              <LessonsIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{subjectLabel}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
              </div>
              {percentage !== null && <ProgressBar value={percentage} label="Progress" />}
            </div>
          </div>
          <Button onClick={onOpen} disabled={!canOpen} className="shrink-0">
            Continue <ArrowRightIcon aria-hidden="true" className="h-4 w-4" />
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="h-full transition-colors duration-150 hover:border-blue-300 dark:hover:border-blue-700">
      <CardBody className="flex h-full flex-col gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subjectLabel}</p>
          <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        {percentage !== null ? (
          <ProgressBar value={percentage} label="Progress" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Single-page lesson</p>
        )}
        {isDownloading && downloadProgress && (
          <DownloadProgress completed={downloadProgress.completed} total={downloadProgress.total} />
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button size="sm" onClick={onOpen} disabled={!canOpen}>
            Continue
          </Button>
          <DownloadButton
            isDownloaded={isDownloaded}
            isDownloading={isDownloading}
            disabled={!isOnline}
            onDownload={onDownload}
            onRemove={onRemove}
          />
        </div>
      </CardBody>
    </Card>
  )
}
