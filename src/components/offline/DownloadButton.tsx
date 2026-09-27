import { Button } from '@/components/ui/Button'

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
