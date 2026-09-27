import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/feedback/LoadingState'
import { useAuth } from '@/features/auth/AuthContext'
import type { Role } from '@/types/auth'

interface ProtectedRouteProps {
  allowedRoles?: Role[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingState message="Checking your session…" />
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
