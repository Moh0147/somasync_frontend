import { env } from '@/app/config/env'

// LessonAttachment's file_reference/image_reference come back as paths
// relative to the Django host (e.g. "/media/..."), not full URLs -- resolve
// them against the API origin, not the frontend's own origin.
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  // Already absolute -- includes blob:/data: URLs for offline-downloaded
  // images (see downloadService/offlineReaderService), which must pass
  // through untouched rather than get an origin prepended.
  if (/^(https?|blob|data):/.test(path)) return path
  return `${env.apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`
}
