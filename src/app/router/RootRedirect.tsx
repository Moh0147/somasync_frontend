import { Navigate } from 'react-router-dom'

import { LoadingState } from '@/components/feedback/LoadingState'
import { useAuth } from '@/features/auth/AuthContext'
import { roleHomeRoute } from '@/features/auth/roleRoutes'
import LandingPage from '@/pages/LandingPage'

// The root path is the public landing page, not an automatic bounce to
// /login -- a signed-in user still gets sent straight to their dashboard,
// but a first-time or signed-out visitor sees the marketing page first and
// reaches /login deliberately via its "Sign In" button.
export function RootRedirect() {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return <LoadingState message="Loading SomaSync…" />
  }

  if (status === 'authenticated' && user) {
    return <Navigate to={roleHomeRoute[user.role]} replace />
  }

  return <LandingPage />
}
