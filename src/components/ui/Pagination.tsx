interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const buttonClasses =
  'rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:text-slate-600'

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={buttonClasses}>
        Previous
      </button>
      <span className="text-slate-500 dark:text-slate-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={buttonClasses}
      >
        Next
      </button>
    </nav>
  )
}
