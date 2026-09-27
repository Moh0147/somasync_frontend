import { ProgressBar } from '@/components/ui/ProgressBar'

interface DownloadProgressProps {
  completed: number
  total: number
}

export function DownloadProgress({ completed, total }: DownloadProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return <ProgressBar value={percentage} label={`Downloading section ${completed} of ${total}`} />
}
