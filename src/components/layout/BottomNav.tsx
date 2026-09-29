import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'

import { CloseIcon, MoreIcon } from '@/components/ui/icons'

import type { NavItem } from './Sidebar'

const MAX_TABS = 4

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
    isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
  }`

export function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const [moreOpen, setMoreOpen] = useState(false)

  const overflow = navItems.length > MAX_TABS
  const tabs = overflow ? navItems.slice(0, MAX_TABS - 1) : navItems
  const rest = overflow ? navItems.slice(MAX_TABS - 1) : []

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-900"
      >
        {tabs.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.to.split('/').length === 2} className={linkClasses}>
              <Icon aria-hidden="true" className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
        {overflow && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation options"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            <MoreIcon aria-hidden="true" className="h-5 w-5" />
            More
          </button>
        )}
      </nav>

      {moreOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMoreOpen(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-white pb-[env(safe-area-inset-bottom)] dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">More</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <CloseIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 p-3">
                {rest.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-xs font-medium ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`
                      }
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
