import {
  getLessonProgress as getLessonProgressRow,
  getSectionProgress as getSectionProgressRow,
  upsertLessonProgress,
  upsertSectionProgress,
} from '@/db/repositories/progressRepository'
import type { OfflineLessonProgress, OfflineSectionProgress } from '@/types/offline'

export async function saveLessonProgress(progress: OfflineLessonProgress) {
  return upsertLessonProgress(progress)
}

export async function getLessonProgress(studentId: number, lessonId: number) {
  return getLessonProgressRow(studentId, lessonId)
}

export async function saveSectionProgress(progress: OfflineSectionProgress) {
  return upsertSectionProgress(progress)
}

export async function getSectionProgress(studentId: number, sectionId: number) {
  return getSectionProgressRow(studentId, sectionId)
}
