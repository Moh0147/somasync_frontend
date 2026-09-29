import type { ReactNode } from 'react'

import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  title: string
  actions?: ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-300 bg-slate-200 px-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {/* The sidebar carries the SomaSync brand on desktop -- on mobile,
            where the sidebar is hidden, this is the only place it appears. */}
        <img src="/soma-icon.png" alt="" className="h-5 w-5 md:hidden" />
        {/* Persistent app-chrome label, not the page's own heading -- each
            page supplies its real <h1> (via PageHeader or its own markup),
            so a screen-reader user navigating by headings lands on actual
            page content rather than this static area name every time. */}
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  )
}
