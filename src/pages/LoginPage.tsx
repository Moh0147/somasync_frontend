import { Link, Navigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { LoginForm } from '@/features/auth/LoginForm'
import { roleHomeRoute } from '@/features/auth/roleRoutes'

export default function LoginPage() {
  const { user, status } = useAuth()

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHomeRoute[user.role]} replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Same header as landing page — "Sign In" replaced with back link */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/soma-icon.png" alt="" className="h-7 w-7" />
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">SomaSync</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button size="sm" variant="ghost">← Back to home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Same Tanzania flag strip as landing page */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #1EB53A 0%, #1EB53A 35%, #FCD116 35%, #FCD116 42%, #000000 42%, #000000 58%, #FCD116 58%, #FCD116 65%, #00A3DD 65%, #00A3DD 100%)',
        }}
      />

      {/* Centered card */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10">
        {/* Faint watermark */}
        <img
          src="/soma-icon.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.04] dark:opacity-[0.08]"
        />

        <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 px-6 py-6">
            {/* Logo + tagline */}
            <div className="flex flex-col items-center gap-2 text-center">
              <img src="/soma-icon.png" alt="SomaSync" className="h-14" />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">SomaSync</p>
                <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                  Elimu ya kisasa · Tanzania
                </p>
              </div>
            </div>

            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use the account provided by your school.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
