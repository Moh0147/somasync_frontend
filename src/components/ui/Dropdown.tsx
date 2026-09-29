import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import { ChevronDownIcon } from './icons'

interface DropdownItem {
  id: string
  label: string
  onSelect: () => void
  destructive?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
}

export function Dropdown({ trigger, items }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerButtonRef.current?.focus()
      }
    }

    // Focus the first item once the menu mounts, so arrow keys work
    // immediately without an extra Tab press.
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const menuItems = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement)
    const nextIndex =
      event.key === 'ArrowDown'
        ? (currentIndex + 1) % menuItems.length
        : (currentIndex - 1 + menuItems.length) % menuItems.length
    menuItems[nextIndex]?.focus()
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {trigger}
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-40 mt-1 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onSelect()
                setOpen(false)
                triggerButtonRef.current?.focus()
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800 ${
                item.destructive ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
