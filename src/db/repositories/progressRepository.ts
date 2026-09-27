import { db } from '@/db/db'
import type { OfflineLessonProgress, OfflineSectionProgress } from '@/types/offline'

export async function upsertLessonProgress(progress: OfflineLessonProgress): Promise<number> {
  const existing = await db.lessonProgress
    .where('[studentId+lessonId]')
    .equals([progress.studentId, progress.lessonId])
    .first()
  if (existing) {
    await db.lessonProgress.put({ ...progress, id: existing.id })
    return existing.id!
  }
  return db.lessonProgress.add(progress) as Promise<number>
}

export function getLessonProgress(studentId: number, lessonId: number) {
  return db.lessonProgress.where('[studentId+lessonId]').equals([studentId, lessonId]).first()
}

export async function upsertSectionProgress(progress: OfflineSectionProgress): Promise<number> {
  const existing = await db.sectionProgress
    .where('[studentId+sectionId]')
    .equals([progress.studentId, progress.sectionId])
    .first()
  if (existing) {
    await db.sectionProgress.put({ ...progress, id: existing.id })
    return existing.id!
  }
  return db.sectionProgress.add(progress) as Promise<number>
}

export function getSectionProgress(studentId: number, sectionId: number) {
  return db.sectionProgress.where('[studentId+sectionId]').equals([studentId, sectionId]).first()
}

export function listSectionProgressForStudent(studentId: number) {
  return db.sectionProgress.where('studentId').equals(studentId).toArray()
}
