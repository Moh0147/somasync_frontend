import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { apiClient } from '@/services/apiClient'
import {
  AUTH_LOGGED_OUT_EVENT,
  clearSession,
  getRefreshToken,
  loadSession,
  saveSession,
  updateCachedUser,
} from '@/services/tokenStore'
import type { AuthUser } from '@/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface LoginResponseData {
  access: string
  refresh: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const session = await loadSession()
      if (!session.accessToken || !session.refreshToken) {
        if (!cancelled) setStatus('unauthenticated')
        return
      }

      if (!cancelled) {
        setUser(session.user)
        setStatus('authenticated')
      }

      try {
        const response = await apiClient.get<{ data: AuthUser }>('/auth/me/')
        if (!cancelled) setUser(response.data.data)
        await updateCachedUser(response.data.data)
      } catch {
        // Offline, or the token was already invalidated -- clearSession()/the
        // logged-out event handles the latter. Either way the cached session
        // already rendered above stands until proven otherwise.
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleLoggedOut = () => {
      setUser(null)
      setStatus('unauthenticated')
    }
    window.addEventListener(AUTH_LOGGED_OUT_EVENT, handleLoggedOut)
    return () => window.removeEventListener(AUTH_LOGGED_OUT_EVENT, handleLoggedOut)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<{ data: LoginResponseData }>('/auth/login/', { username, password })
    const { access, refresh, user: loggedInUser } = response.data.data
    await saveSession({ accessToken: access, refreshToken: refresh, user: loggedInUser })
    setUser(loggedInUser)
    setStatus('authenticated')
    return loggedInUser
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken })
      }
    } catch {
      // Refresh token may already be invalid/expired -- clearing it locally
      // still logs the user out either way.
    } finally {
      await clearSession()
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
