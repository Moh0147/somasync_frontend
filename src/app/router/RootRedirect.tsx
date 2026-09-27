import { Navigate } from 'react-router-dom'

import { LoadingState } from '@/components/feedback/LoadingState'
import { useAuth } from '@/features/auth/AuthContext'
import { roleHomeRoute } from '@/features/auth/roleRoutes'

export function RootRedirect() {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return <LoadingState message="Loading SomaSync…" />
  }

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHomeRoute[user.role]} replace />
  }

  return <Navigate to="/login" replace />
}
