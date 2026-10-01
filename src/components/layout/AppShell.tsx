import type { ReactNode } from 'react'

import { OfflineBanner } from '@/components/offline/OfflineBanner'

import { BottomNav } from './BottomNav'
import type { NavItem } from './Sidebar'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  title: string
  navItems: NavItem[]
  children: ReactNode
  topBarActions?: ReactNode
}

export function AppShell({ title, navItems, children, topBarActions }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Lets a keyboard user jump past the sidebar's nav items straight to
          the page content, instead of tabbing through them on every page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar navItems={navItems} roleLabel={title} />
      <div className="flex flex-1 flex-col">
        <TopBar title={title} actions={topBarActions} />
        <OfflineBanner />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 pb-20 focus:outline-none md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav navItems={navItems} />
    </div>
  )
}
