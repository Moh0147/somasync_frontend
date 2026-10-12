const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set')
}

function resolveApiOrigin(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    
    return window.location.origin
  }
}

export const env = {
  apiBaseUrl,
  apiOrigin: resolveApiOrigin(apiBaseUrl),
} as const
