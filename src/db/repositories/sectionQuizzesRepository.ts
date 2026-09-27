import { db } from '@/db/db'
import type { OfflineSectionQuiz } from '@/types/offline'

export async function upsertSectionQuiz(quiz: OfflineSectionQuiz): Promise<number> {
  const existing = await db.sectionQuizzes.where('serverId').equals(quiz.serverId).first()
  if (existing) {
    await db.sectionQuizzes.put({ ...quiz, id: existing.id })
    return existing.id!
  }
  return db.sectionQuizzes.add(quiz) as Promise<number>
}

export function getQuizForSection(sectionId: number) {
  return db.sectionQuizzes.where('sectionId').equals(sectionId).first()
}

export function deleteSectionQuiz(id: number) {
  return db.sectionQuizzes.delete(id)
}
