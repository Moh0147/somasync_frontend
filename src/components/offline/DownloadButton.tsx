import { Button } from '@/components/ui/Button'
import { TrashIcon } from '@/components/ui/icons'

interface DownloadButtonProps {
  isDownloaded: boolean
  isDownloading: boolean
  disabled?: boolean
  onDownload: () => void
  onRemove: () => void
}

export function DownloadButton({ isDownloaded, isDownloading, disabled, onDownload, onRemove }: DownloadButtonProps) {
  if (isDownloading) {
    return (
      <Button size="sm" variant="secondary" disabled>
        Downloading…
      </Button>
    )
  }

  if (isDownloaded) {
    return (
      <Button size="sm" variant="ghost" onClick={onRemove}>
        <TrashIcon className="h-3.5 w-3.5" />
        Remove download
      </Button>
    )
  }

  return (
    <Button size="sm" variant="secondary" disabled={disabled} onClick={onDownload}>
      Download for Offline
    </Button>
  )
}
