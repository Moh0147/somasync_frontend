import { db } from '@/db/db'
import type { OfflineLessonSection } from '@/types/offline'

export async function upsertSection(section: OfflineLessonSection): Promise<number> {
  const existing = await db.lessonSections.where('serverId').equals(section.serverId).first()
  if (existing) {
    await db.lessonSections.put({ ...section, id: existing.id })
    return existing.id!
  }
  return db.lessonSections.add(section) as Promise<number>
}

export function getSectionById(id: number) {
  return db.lessonSections.get(id)
}

export function getSectionByServerId(serverId: number) {
  return db.lessonSections.where('serverId').equals(serverId).first()
}

export function listSectionsForLesson(lessonId: number) {
  return db.lessonSections.where('lessonId').equals(lessonId).sortBy('order')
}

export function deleteSection(id: number) {
  return db.lessonSections.delete(id)
}
