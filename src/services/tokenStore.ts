import { db } from '@/db/db'
import type { AuthUser } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'auth.accessToken'
const REFRESH_TOKEN_KEY = 'auth.refreshToken'
const USER_KEY = 'auth.user'

export const AUTH_LOGGED_OUT_EVENT = 'somasync:auth-logged-out'

let accessToken: string | null = null
let refreshToken: string | null = null

export async function loadSession() {
  const [accessRecord, refreshRecord, userRecord] = await Promise.all([
    db.metadata.get(ACCESS_TOKEN_KEY),
    db.metadata.get(REFRESH_TOKEN_KEY),
    db.metadata.get(USER_KEY),
  ])

  accessToken = (accessRecord?.value as string) ?? null
  refreshToken = (refreshRecord?.value as string) ?? null

  return {
    accessToken,
    refreshToken,
    user: (userRecord?.value as AuthUser | undefined) ?? null,
  }
}

export async function saveSession(next: { accessToken: string; refreshToken: string; user: AuthUser }) {
  accessToken = next.accessToken
  refreshToken = next.refreshToken
  await Promise.all([
    db.metadata.put({ key: ACCESS_TOKEN_KEY, value: next.accessToken }),
    db.metadata.put({ key: REFRESH_TOKEN_KEY, value: next.refreshToken }),
    db.metadata.put({ key: USER_KEY, value: next.user }),
  ])
}

export async function saveTokens(next: { accessToken: string; refreshToken: string }) {
  accessToken = next.accessToken
  refreshToken = next.refreshToken
  await Promise.all([
    db.metadata.put({ key: ACCESS_TOKEN_KEY, value: next.accessToken }),
    db.metadata.put({ key: REFRESH_TOKEN_KEY, value: next.refreshToken }),
  ])
}

export async function updateCachedUser(user: AuthUser) {
  await db.metadata.put({ key: USER_KEY, value: user })
}

export async function clearSession() {
  accessToken = null
  refreshToken = null
  await Promise.all([
    db.metadata.delete(ACCESS_TOKEN_KEY),
    db.metadata.delete(REFRESH_TOKEN_KEY),
    db.metadata.delete(USER_KEY),
  ])
  window.dispatchEvent(new Event(AUTH_LOGGED_OUT_EVENT))
}

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return refreshToken
}
