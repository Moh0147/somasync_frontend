import { Navigate } from 'react-router-dom'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-6 text-center">
        <span className="text-lg font-semibold text-blue-600">SomaSync</span>
      </div>
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-5">
          <div>
            <h1 className="text-base font-semibold text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Use the account provided by your school.</p>
          </div>
          <LoginForm />
        </CardBody>
      </Card>
    </div>
  )
}
