import { useState } from 'react'
import type { ReactNode } from 'react'

import { OfflineBanner } from '@/components/offline/OfflineBanner'

import { MobileNav } from './MobileNav'
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} navItems={navItems} />
      <div className="flex flex-1 flex-col">
        <TopBar title={title} onMenuClick={() => setMobileNavOpen(true)} actions={topBarActions} />
        <OfflineBanner />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
