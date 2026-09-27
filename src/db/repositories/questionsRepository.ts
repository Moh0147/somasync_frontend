import { db } from '@/db/db'
import type { OfflineQuestion } from '@/types/offline'

export async function upsertQuestion(question: OfflineQuestion): Promise<number> {
  const existing = await db.questions.where('serverId').equals(question.serverId).first()
  if (existing) {
    await db.questions.put({ ...question, id: existing.id })
    return existing.id!
  }
  return db.questions.add(question) as Promise<number>
}

export function listQuestionsForQuiz(quizId: number) {
  return db.questions.where('quizId').equals(quizId).sortBy('order')
}

export function deleteQuestion(id: number) {
  return db.questions.delete(id)
}
