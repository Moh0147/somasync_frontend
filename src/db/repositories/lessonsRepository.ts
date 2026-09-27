import { db } from '@/db/db'
import type { OfflineLesson } from '@/types/offline'

export async function upsertLesson(lesson: OfflineLesson): Promise<number> {
  const existing = await db.lessons.where('serverId').equals(lesson.serverId).first()
  if (existing) {
    await db.lessons.put({ ...lesson, id: existing.id })
    return existing.id!
  }
  return db.lessons.add(lesson) as Promise<number>
}

export function getLessonById(id: number) {
  return db.lessons.get(id)
}

export function getLessonByServerId(serverId: number) {
  return db.lessons.where('serverId').equals(serverId).first()
}

export function listDownloadedLessons() {
  return db.lessons.toArray()
}

export function deleteLesson(id: number) {
  return db.lessons.delete(id)
}
