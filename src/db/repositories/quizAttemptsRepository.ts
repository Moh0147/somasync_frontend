import { db } from '@/db/db'
import type { OfflineQuizAnswer, OfflineQuizAttempt, OfflineSyncStatus } from '@/types/offline'

export function addAttempt(attempt: OfflineQuizAttempt) {
  return db.quizAttempts.add(attempt) as Promise<number>
}

export function getAttemptById(id: number) {
  return db.quizAttempts.get(id)
}

export function listAttemptsForQuiz(quizId: number) {
  return db.quizAttempts.where('quizId').equals(quizId).toArray()
}

export function listAttemptsByStatus(syncStatus: OfflineSyncStatus) {
  return db.quizAttempts.where('syncStatus').equals(syncStatus).toArray()
}

export function updateAttemptStatus(id: number, syncStatus: OfflineSyncStatus, serverId?: number) {
  return db.quizAttempts.update(id, { syncStatus, ...(serverId !== undefined && { serverId }) })
}

export async function updateAttemptResult(
  id: number,
  result: { score: number; percentage: number; passed: boolean },
) {
  return db.quizAttempts.update(id, {
    score: result.score,
    percentage: result.percentage,
    passed: result.passed,
    submittedAt: new Date().toISOString(),
    syncStatus: 'SYNCED',
  })
}

export async function saveAnswer(answer: OfflineQuizAnswer): Promise<number> {
  const existing = await db.quizAnswers
    .where('[attemptId+questionId]')
    .equals([answer.attemptId, answer.questionId])
    .first()
  if (existing) {
    await db.quizAnswers.put({ ...answer, id: existing.id })
    return existing.id!
  }
  return db.quizAnswers.add(answer) as Promise<number>
}

export function listAnswersForAttempt(attemptId: number) {
  return db.quizAnswers.where('attemptId').equals(attemptId).toArray()
}
