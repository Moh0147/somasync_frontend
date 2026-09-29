import { Navigate } from 'react-router-dom'

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
      {/* Background watermark -- large, centered, faded well behind the
          card so the form stays fully readable. `pointer-events-none` and
          `aria-hidden` since it's purely decorative. */}
      <img
        src="/soma-icon.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-[0.06] dark:opacity-[0.1]"
      />

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
