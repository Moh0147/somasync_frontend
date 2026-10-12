import type { ReactNode } from 'react'

import { ThemeToggle } from './ThemeToggle'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

interface TopBarProps {
  title: string
  actions?: ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-300 bg-slate-200 px-4 md:-ml-12 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {
}
        <img src="/soma-icon.png" alt="" className="h-5 w-5 md:hidden" />
        {

}
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 md:hidden">{title}</p>
      </div>
      <div className="flex items-center gap-2">
        <InstallPrompt />
        <ThemeToggle />
        {actions}
      </div>
    </header>
  )
}
