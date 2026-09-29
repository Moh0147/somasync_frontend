interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500"
      />
      <p className="text-sm">{message}</p>
    </div>
  )
}
