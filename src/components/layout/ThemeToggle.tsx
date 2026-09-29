import { DarkModeIcon, LightModeIcon } from '@/components/ui/icons'
import { useTheme } from '@/features/theme/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      {isDark ? <LightModeIcon aria-hidden="true" className="h-4 w-4" /> : <DarkModeIcon aria-hidden="true" className="h-4 w-4" />}
    </button>
  )
}
