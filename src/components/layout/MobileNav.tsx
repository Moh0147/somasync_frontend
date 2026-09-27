import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'

import { CloseIcon } from '@/components/ui/icons'

import type { NavItem } from './Sidebar'

interface MobileNavProps {
  open: boolean
  onClose: () => void
  navItems: NavItem[]
  brand?: string
}

export function MobileNav({ open, onClose, navItems, brand = 'SomaSync' }: MobileNavProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white">
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-blue-600">{brand}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>,
    document.body,
  )
}
