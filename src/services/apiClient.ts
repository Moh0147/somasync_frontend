import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { env } from '@/app/config/env'

import { clearSession, getAccessToken, getRefreshToken, saveTokens } from './tokenStore'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await axios.post<{ data: { access: string; refresh: string } }>(
      `${env.apiBaseUrl}/auth/refresh/`,
      { refresh: refreshToken },
    )
    const { access, refresh } = response.data.data
    await saveTokens({ accessToken: access, refreshToken: refresh })
    return access
  } catch {
    await clearSession()
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newAccessToken = await refreshPromise
      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return apiClient(originalRequest)
      }
    }

    return Promise.reject(error)
  },
)
