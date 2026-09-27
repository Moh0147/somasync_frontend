import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return 'Network error. Check your connection and try again.'

  const errors = (error.response.data as { errors?: unknown } | undefined)?.errors
  if (typeof errors === 'string') return errors

  if (errors && typeof errors === 'object') {
    const record = errors as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail

    const firstValue = Object.values(record)[0]
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0]
    if (typeof firstValue === 'string') return firstValue
  }

  return fallback
}
