import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'

// AdminAreaPage renders one merged route tree for both admin scopes so a
// mistyped or guessed URL from the WRONG scope lands on the same explicit
// "you don't have access" page a role mismatch gets (via ProtectedRoute),
// instead of silently bouncing back to the admin's own dashboard with no
// explanation. This is UX only -- the real boundary is the backend's
// IsSystemAdmin/IsSchoolAdmin permission classes, which reject the
// underlying API calls regardless of what this ever renders.
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
