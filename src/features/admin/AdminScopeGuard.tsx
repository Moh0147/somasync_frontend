import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'

export function RequireSystemAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.admin_scope !== 'SYSTEM') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}

export function RequireSchoolAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.admin_scope !== 'SCHOOL') return <Navigate to="/unauthorized" replace />
  return <>{children}</>
}
