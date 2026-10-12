import { Link, NavLink } from 'react-router-dom'
import type { ComponentType, SVGProps } from 'react'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

interface SidebarProps {
  navItems: NavItem[]
  roleLabel: string
}

export function Sidebar({ navItems, roleLabel }: SidebarProps) {
  const dashboardPath = navItems.find((item) => item.label === 'Dashboard')?.to ?? '/'

  return (
    <aside className="sticky top-0 z-30 hidden h-screen w-56 shrink-0 self-start flex-col rounded-tr-[4rem] border-r border-[#1b5664] bg-[#123b4a] md:flex dark:border-[#263656] dark:bg-[#101b33]">
      <div className="flex min-h-[4.5rem] items-center border-b border-[#1b5664] px-4 py-2.5 dark:border-[#263656]">
        <Link
          to={dashboardPath}
          aria-label={`SomaSync ${roleLabel} dashboard`}
          className="flex min-w-0 items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#123b4a] dark:focus-visible:ring-blue-200 dark:focus-visible:ring-offset-[#101b33]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/95 shadow-sm">
            <img src="/soma-icon.png" alt="" className="h-8 w-8 object-contain" />
          </span>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-white">SomaSync</span>
            <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-teal-200">{roleLabel}</span>
          </div>
        </Link>
        {}
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
                    ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10 dark:bg-blue-400/15 dark:text-blue-100 dark:ring-blue-200/15'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:text-white'
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
