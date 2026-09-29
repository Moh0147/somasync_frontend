import { AlertIcon } from '@/components/ui/icons'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong.', description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 py-12 text-center dark:border-red-500/20 dark:bg-red-500/10">
      <AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{title}</p>
      {description && <p className="max-w-sm text-sm text-red-600 dark:text-red-400">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/20"
        >
          Retry
        </button>
      )}
    </div>
  )
}
