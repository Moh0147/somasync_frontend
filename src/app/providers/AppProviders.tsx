import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { ToastProvider } from '@/components/feedback/Toast'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { runSync } from '@/features/sync/syncEngine'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

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
