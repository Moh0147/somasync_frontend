import { NavLink } from 'react-router-dom'

export interface NavItem {
  label: string
  to: string
}

interface SidebarProps {
  navItems: NavItem[]
  brand?: string
}

export function Sidebar({ navItems, brand = 'SomaSync' }: SidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <span className="text-sm font-semibold text-blue-600">{brand}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
