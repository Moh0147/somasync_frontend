import {
  addAttempt,
  getAttemptById,
  listAttemptsByStatus,
  listAttemptsForQuiz,
  saveAnswer as saveAnswerRow,
  updateAttemptResult as updateAttemptResultRow,
  updateAttemptStatus,
} from '@/db/repositories/quizAttemptsRepository'
import type { OfflineQuizAnswer, OfflineQuizAttempt, OfflineSyncStatus } from '@/types/offline'

export async function saveAttempt(attempt: OfflineQuizAttempt) {
  return addAttempt(attempt)
}

export async function getAttempt(id: number) {
  return getAttemptById(id)
}

export async function getAttemptsForQuiz(quizId: number) {
  return listAttemptsForQuiz(quizId)
}

export async function getAttemptsPendingSync() {
  return listAttemptsByStatus('PENDING')
}

export async function markAttemptSyncStatus(id: number, status: OfflineSyncStatus, serverId?: number) {
  return updateAttemptStatus(id, status, serverId)
}

export async function updateAttemptResult(id: number, result: { score: number; percentage: number; passed: boolean }) {
  return updateAttemptResultRow(id, result)
}

export async function saveAnswer(answer: OfflineQuizAnswer) {
  return saveAnswerRow(answer)
}
