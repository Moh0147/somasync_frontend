import axios from 'axios'

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item)
      if (message) return message
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const message = firstMessage(item)
      if (message) return message
    }
  }
  return null
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) return error instanceof Error && error.message ? error.message : fallback
  if (!error.response) return 'Network error. Check your connection and try again.'

  const body = error.response.data as { errors?: unknown; detail?: unknown; message?: unknown } | undefined
  const message = firstMessage(body?.errors ?? body?.detail ?? body?.message)
  if (message) return message

  return fallback
}
