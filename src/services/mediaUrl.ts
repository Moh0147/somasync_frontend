import { env } from '@/app/config/env'

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  
  
  
  if (/^(https?|blob|data):/.test(path)) return path
  return `${env.apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`
}
