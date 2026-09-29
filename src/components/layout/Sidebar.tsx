import { NavLink } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

interface SidebarProps {
  navItems: NavItem[]
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-300 bg-slate-200 md:flex dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-16 flex-col justify-center gap-0.5 border-b border-slate-300 px-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <img src="/soma-icon.png" alt="" className="h-6 w-6" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">SomaSync</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Learn anywhere. Sync when connected.</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
