import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { ToastProvider } from '@/components/feedback/Toast'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { runSync } from '@/features/sync/syncEngine'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// Runs whenever the app is online with an authenticated student -- both on
// initial load (pending items left over from a previous offline session)
// and on the offline->online transition (reconnect). Only PENDING entries
// are retried automatically; FAILED ones wait for an explicit "Sync Now".
function AutoSync() {
  const { user, status } = useAuth()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (status !== 'authenticated' || !user || user.role !== 'STUDENT' || !isOnline) return
    runSync(user.id)
  }, [isOnline, status, user])

  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AutoSync />
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
