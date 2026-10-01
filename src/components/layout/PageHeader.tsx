import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  /** Override the automatic parent navigation for detail pages. */
  backHref?: string
  backLabel?: string
  hideBack?: boolean
}

export function PageHeader({ title, description, actions, backHref, backLabel = 'Back', hideBack = false }: PageHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const segments = location.pathname.split('/').filter(Boolean)
  // List/dashboard pages remain uncluttered. Detail/editor pages get a
  // consistent parent affordance without every page having to duplicate it.
  const shouldShowBack = !hideBack && (Boolean(backHref) || segments.length >= 3)

  return (
    <div className="flex items-start justify-between gap-4 border-l-4 border-blue-600 bg-white px-4 py-3 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        {shouldShowBack && (
          <button
            type="button"
            onClick={() => (backHref ? navigate(backHref) : navigate(-1))}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={backLabel}
          >
            ← <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
