import type { ReactNode } from 'react'

import { MenuIcon } from '@/components/ui/icons'

interface TopBarProps {
  title: string
  onMenuClick?: () => void
  actions?: ReactNode
}

export function TopBar({ title, onMenuClick, actions }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
