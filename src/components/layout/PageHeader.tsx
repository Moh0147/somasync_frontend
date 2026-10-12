import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  
  backHref?: string
  backLabel?: string
  hideBack?: boolean
}

export function PageHeader({ title, description, actions, backHref, backLabel = 'Back', hideBack = false }: PageHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const segments = location.pathname.split('/').filter(Boolean)
  const shouldShowBack = !hideBack && (Boolean(backHref) || segments.length >= 3)

  return (
    <div className="border-l-4 border-blue-600 bg-white px-4 py-3 dark:bg-slate-900">
      {shouldShowBack && (
        <button
          type="button"
          onClick={() => (backHref ? navigate(backHref) : navigate(-1))}
          className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
          aria-label={backLabel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          {backLabel}
        </button>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
          {description && <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
