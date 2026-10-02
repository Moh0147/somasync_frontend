import { Link, Navigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Card, CardBody } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/AuthContext'
import { LoginForm } from '@/features/auth/LoginForm'
import { roleHomeRoute } from '@/features/auth/roleRoutes'

export default function LoginPage() {
  const { user, status } = useAuth()

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHomeRoute[user.role]} replace />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <img
        src="/soma-icon.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.06] dark:opacity-[0.1]"
      />

      <div className="absolute top-4 left-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Back to home
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-sm">
        <CardBody className="flex flex-col gap-5">
          <div>
            <div className="relative z-10 mb-6 flex flex-col items-center gap-2 text-center">
              <img src="/soma-icon.png" alt="" className="h-16" />
              <span className="text-lg font-semibold text-black-600 dark:text-black-400">SomaSync</span>
            </div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the account provided by your school.</p>
          </div>
          <LoginForm />
        </CardBody>
      </Card>
    </div>
  )
}
